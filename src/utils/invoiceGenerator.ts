/**
 * Invoice generator utility
 * Generates machine-readable invoice JSON for credit purchases
 */

import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
  id: string;
  botId: string;
  botName: string;
  date: string;
  amount: number;
  pricePerCredit: number;
  totalPrice: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl: string;
}

export class InvoiceGenerator {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate an invoice for a credit purchase
   * @param botId Bot ID
   * @param botName Bot name
   * @param amount Number of credits purchased
   * @returns Invoice object
   */
  generateInvoice(botId: string, botName: string, amount: number): Invoice {
    const invoiceId = uuidv4();
    const pricePerCredit = 0.001; // $0.001 per credit
    const totalPrice = amount * pricePerCredit;
    
    const invoice: Invoice = {
      id: invoiceId,
      botId,
      botName,
      date: new Date().toISOString(),
      amount,
      pricePerCredit,
      totalPrice,
      currency: 'USD',
      status: 'paid', // Simulating immediate payment
      invoiceUrl: `${this.baseUrl}/invoices/${invoiceId}`
    };
    
    return invoice;
  }

  /**
   * Get a formatted invoice URL
   * @param invoiceId Invoice ID
   * @returns Full URL to the invoice
   */
  getInvoiceUrl(invoiceId: string): string {
    return `${this.baseUrl}/invoices/${invoiceId}`;
  }
}

// Export a singleton instance
export const invoiceGenerator = new InvoiceGenerator();
