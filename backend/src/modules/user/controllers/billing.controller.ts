// backend/src/modules/user/controllers/billing.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe only if keys are provided
const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
const stripe = stripeEnabled 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })
  : null;

// Stripe price IDs mapped to subscription plans
const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  [SubscriptionPlan.INDIVIDUAL_BASIC]: process.env.STRIPE_PRICE_INDIVIDUAL_BASIC,
  [SubscriptionPlan.INDIVIDUAL_PRO]: process.env.STRIPE_PRICE_INDIVIDUAL_PRO,
  [SubscriptionPlan.COACH_BASIC]: process.env.STRIPE_PRICE_COACH_BASIC,
  [SubscriptionPlan.COACH_PRO]: process.env.STRIPE_PRICE_COACH_PRO,
  [SubscriptionPlan.COACH_UNLIMITED]: process.env.STRIPE_PRICE_COACH_UNLIMITED,
};

/**
 * Upgrade subscription (Stripe optional)
 */
export const upgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { plan, paymentMethodId } = req.body;

    if (!plan || !Object.values(SubscriptionPlan).includes(plan)) {
      res.status(400).json({ error: 'Invalid subscription plan' });
      return;
    }

    // If Stripe is not configured, just update the database
    if (!stripeEnabled) {
      const subscription = await prisma.subscription.upsert({
        where: { userId },
        update: {
          plan: plan as SubscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          cancelledAt: null
        },
        create: {
          userId,
          plan: plan as SubscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      res.json({
        message: 'Subscription updated successfully (Test Mode)',
        subscription
      });
      return;
    }

    // Stripe integration code (only runs if Stripe is configured)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let stripeCustomerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId && stripe) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id }
      });
      stripeCustomerId = customer.id;
    }

    // Attach payment method if provided
    if (paymentMethodId && stripeCustomerId && stripe) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
      
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // Cancel existing subscription if any
    if (user.subscription?.stripeSubscriptionId && stripe) {
      await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
    }

    // Create new subscription
    const priceId = STRIPE_PRICE_IDS[plan as string];
    if (!priceId) {
      res.status(400).json({ error: 'Stripe price not configured for this plan' });
      return;
    }

    const stripeSubscription = stripe ? await stripe.subscriptions.create({
      customer: stripeCustomerId!,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent']
    }) : null;

    // Update or create subscription in database
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: plan as SubscriptionPlan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription?.id,
        currentPeriodStart: stripeSubscription ? new Date(stripeSubscription.current_period_start * 1000) : new Date(),
        currentPeriodEnd: stripeSubscription ? new Date(stripeSubscription.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelledAt: null
      },
      create: {
        userId,
        plan: plan as SubscriptionPlan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription?.id,
        currentPeriodStart: stripeSubscription ? new Date(stripeSubscription.current_period_start * 1000) : new Date(),
        currentPeriodEnd: stripeSubscription ? new Date(stripeSubscription.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Create payment record if Stripe payment was made
    if (stripeSubscription?.latest_invoice) {
      const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status || 'pending',
          stripePaymentId: invoice.payment_intent as string
        }
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SUBSCRIPTION_UPGRADED',
        entityType: 'Subscription',
        entityId: subscription.id,
        metadata: { fromPlan: user.subscription?.plan, toPlan: plan },
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || ''
      }
    });

    res.json({
      message: 'Subscription upgraded successfully',
      subscription,
      clientSecret: stripeSubscription ? (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret : undefined
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};

/**
 * Downgrade subscription (Stripe optional)
 */
export const downgradeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { plan } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }

    // If Stripe is not configured, just update the database
    if (!stripeEnabled || !subscription.stripeSubscriptionId) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: plan as SubscriptionPlan,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      res.json({ message: 'Subscription downgraded successfully (Test Mode)' });
      return;
    }

    // Stripe integration code (only runs if Stripe is configured)
    if (!stripe) {
      res.status(503).json({ error: 'Payment processing not available' });
      return;
    }

    const priceId = STRIPE_PRICE_IDS[plan as string];
    if (!priceId) {
      res.status(400).json({ error: 'Stripe price not configured for this plan' });
      return;
    }

    // Get the subscription items first
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    
    // Update subscription at period end to avoid prorating
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: priceId
        }],
        proration_behavior: 'none',
        cancel_at_period_end: false
      }
    );

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: plan as SubscriptionPlan,
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
      }
    });

    res.json({ message: 'Subscription will be downgraded at the end of current billing period' });
  } catch (error) {
    console.error('Downgrade subscription error:', error);
    res.status(500).json({ error: 'Failed to downgrade subscription' });
  }
};

/**
 * Reactivate cancelled subscription (Stripe optional)
 */
export const reactivateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription || subscription.status !== SubscriptionStatus.CANCELLED) {
      res.status(400).json({ error: 'No cancelled subscription to reactivate' });
      return;
    }

    // If Stripe is configured and subscription has Stripe ID
    if (stripeEnabled && stripe && subscription.stripeSubscriptionId) {
      // Reactivate in Stripe
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: false }
      );

      // Update database
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          cancelledAt: null,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        }
      });
    } else {
      // Just update database (test mode)
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          cancelledAt: null,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }

    res.json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
};

/**
 * Add payment method (Stripe optional - returns mock data in test mode)
 */
export const addPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { paymentMethodId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    // If Stripe is not configured, return mock success
    if (!stripeEnabled || !stripe) {
      res.json({
        message: 'Payment method added successfully (Test Mode)',
        paymentMethod: {
          id: 'pm_test_' + Math.random().toString(36).substring(7),
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025
        }
      });
      return;
    }

    if (!user?.subscription?.stripeCustomerId) {
      res.status(400).json({ error: 'No subscription found' });
      return;
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.subscription.stripeCustomerId
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    res.json({
      message: 'Payment method added successfully',
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year
      }
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
};

/**
 * Delete payment method (Stripe optional)
 */
export const deletePaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentMethodId } = req.params;

    // If Stripe is not configured, return mock success
    if (!stripeEnabled || !stripe) {
      res.json({ message: 'Payment method deleted successfully (Test Mode)' });
      return;
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
};

/**
 * Set default payment method (Stripe optional)
 */
export const setDefaultPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { paymentMethodId } = req.params;

    // If Stripe is not configured, return mock success
    if (!stripeEnabled || !stripe) {
      res.json({ message: 'Default payment method updated (Test Mode)' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription?.stripeCustomerId) {
      res.status(400).json({ error: 'No subscription found' });
      return;
    }

    await stripe.customers.update(user.subscription.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    res.json({ message: 'Default payment method updated' });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
};

/**
 * Download invoice (Stripe optional - returns placeholder in test mode)
 */
export const downloadInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.currentUser?.id;
    const { paymentId } = req.params;

    // If Stripe is not configured, return placeholder
    if (!stripeEnabled || !stripe) {
      res.json({ 
        invoiceUrl: null,
        message: 'Invoices not available in test mode' 
      });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        subscription: { userId }
      }
    });

    if (!payment || !payment.stripePaymentId) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Get invoice from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentId);
    const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);

    if (!invoice.invoice_pdf) {
      res.status(404).json({ error: 'Invoice PDF not available' });
      return;
    }

    res.json({ invoiceUrl: invoice.invoice_pdf });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
};

/**
 * Handle Stripe webhook events (Only works with Stripe)
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // If Stripe is not configured, return success (webhook endpoint exists but does nothing)
    if (!stripeEnabled || !stripe) {
      res.json({ received: true, message: 'Stripe not configured' });
      return;
    }

    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    if (!endpointSecret) {
      res.status(400).json({ error: 'Webhook secret not configured' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      res.status(400).json({ error: 'Webhook signature verification failed' });
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        
        // Find subscription
        const subscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: invoice.customer as string }
        });

        if (subscription) {
          // Create payment record
          await prisma.payment.create({
            data: {
              subscriptionId: subscription.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              stripePaymentId: invoice.payment_intent as string
            }
          });

          // Update subscription period
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              currentPeriodStart: new Date(invoice.period_start * 1000),
              currentPeriodEnd: new Date(invoice.period_end * 1000)
            }
          });
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        
        // Handle failed payment
        const failedSubscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: failedInvoice.customer as string }
        });

        if (failedSubscription) {
          // Send notification to user
          await prisma.notification.create({
            data: {
              userId: failedSubscription.userId,
              type: 'PAYMENT_FAILED',
              title: 'Payment Failed',
              message: 'We were unable to process your payment. Please update your payment method.'
            }
          });
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: deletedSubscription.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            cancelledAt: new Date()
          }
        });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};