import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #SeatReservationService = new SeatReservationService();

  #TicketPaymentService = new TicketPaymentService();

  static PaymentMap = new Map([
    ['INFANT', 0],
    ['CHILD', 10],
    ['ADULT', 20]
  ]);

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validatePurchase(accountId, ticketTypeRequests);

    const totalCostOfTickets = this.#calculateTotalTicketCost(ticketTypeRequests);
    const totalNumOfSeats = this.#calculateTotalNumberOfSeats(ticketTypeRequests);

    this.#TicketPaymentService.makePayment(accountId, totalCostOfTickets);
    this.#SeatReservationService.reserveSeat(accountId, totalNumOfSeats);
  }

  #validatePurchase(accountId, ticketTypeRequests) {
    this.#validateAccountId(accountId);
    this.#validateTicketRequest(ticketTypeRequests);
  }

  #validateAccountId(accountId) {
    if(typeof accountId !== 'number' || accountId < 0) {
      throw new InvalidPurchaseException('AccountId must be a non-negative number');
    }
    return accountId;
  }

  #validateTicketRequest(ticketTypeRequests) {
    const allTicketRequestsAreValid = ticketTypeRequests.every(request => request instanceof TicketTypeRequest);

    if(!allTicketRequestsAreValid) {
      throw new InvalidPurchaseException('One or more ticket requests are not valid.');
    }
    
    const hasAdultTicket = this.#hasAdultTicket(ticketTypeRequests);
    const totalNumOfTickets = this.#calculateNumberOfTickets(ticketTypeRequests);

    if(!hasAdultTicket) {
      throw new InvalidPurchaseException('Child and Infant tickets cannot be purchased without purchasing an Adult ticket');
    }

    if(totalNumOfTickets > 20) {
      throw new InvalidPurchaseException('Only a maximum of 20 tickets can be purchased at once')
    }
  }

  #hasAdultTicket(ticketTypeRequests) {
    return ticketTypeRequests.some(request => request.getTicketType() === 'ADULT');
  }

  #calculateNumberOfTickets(ticketTypeRequests) {
    return ticketTypeRequests.reduce((numOfTickets, request) => numOfTickets + request.getNoOfTickets(), 0)
  }

  #calculateTotalTicketCost(ticketTypeRequests) {
    return ticketTypeRequests.reduce((totalCost, request) => totalCost + (request.getNoOfTickets() * TicketService.PaymentMap.get(request.getTicketType())), 0)
  }

  #calculateTotalNumberOfSeats(ticketTypeRequests) {
    return ticketTypeRequests.filter(request => request.getTicketType() !== 'INFANT').reduce((numOfSeats, request) => numOfSeats + request.getNoOfTickets(), 0)
  }

}
