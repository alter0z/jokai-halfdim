/**
 * All bot text strings
 *
 * Keep bot messages in one place for easy translation later
 */

export const texts = {
  // Common
  error: 'Something went wrong. Please try again or contact support.',
  noPermission: 'You don\'t have permission to use this command.',
  shopClosed: 'The shop is currently closed. Please try again later.',
  queueFull: 'The queue is full. Please try again later.',

  // Commands
  price: {
    selectService: 'Choose a service:',
    selectRegion: 'Which region?',
    selectItems: 'Choose items to include:',
    noItems: 'Please select at least one item.',
    cartTitle: '🧾 Price estimate',
    addService: '+ Add service',
    removeItem: 'Remove item',
    placeOrder: 'Place order',
    totalPay: 'Total (pay after work)',
  },

  priceList: {
    title: '💰 Price List',
    noServices: 'No services available.',
  },

  orders: {
    title: 'My Orders',
    noOrders: 'You have no orders yet.',
    status: 'Status',
    queue: 'Queue position',
    progress: 'Progress',
  },

  build: {
    character: 'Character',
    stats: 'Recommended stats',
    talents: 'Talent priority',
    mainStats: 'Main stats',
    notFound: 'Character not found.',
  },

  shop: {
    opened: 'Shop is now open.',
    closed: 'Shop is now closed.',
  },

  pay: {
    noProof: 'Please attach a payment proof.',
    received: 'Payment proof received. Thank you! Waiting for confirmation.',
  },

  // Order flow
  orderPlaced: 'Order placed successfully! Thread created.',
  orderAccepted: 'Your order has been accepted. Sending login link...',
  orderDeclined: 'Your order was declined.',
  orderExpired: 'Your order has expired. Please place a new order.',
  orderStarted: 'Work has started on your order.',
  orderOnHold: 'Your order is on hold.',
  orderDone: 'Work is complete! Invoice and payment methods below.',
  paymentConfirmed: 'Payment confirmed! Thank you for using Jokai. Please change your password.',
  orderCompleted: 'Order completed.',

  // Errors
  firstOrderTooHigh: (limit: number) => `First-time customers are limited to Rp${limit.toLocaleString('id-ID')}. Please place a smaller order.`,
  alreadyHasUnpaid: 'You have an unpaid order. Please pay it first before placing a new order.',
  blocked: 'You are blocked from placing new orders.',

  // Prompts
  termsAccept: 'I understand and accept the terms',
  confirmNewPrice: 'The actual percentage is lower than stated. Accept new price?',
  reportProblem: 'Report a problem',
  needVerificationCode: 'Need verification code',
  finalizeWork: 'Mark as done',
};

export default texts;
