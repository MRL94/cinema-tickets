import chai  from 'chai';
import sinonChai from 'sinon-chai';
import sinon  from 'sinon';

import TicketService from '../../src/pairtest/TicketService.js';
import TicketTypeRequest from '../../src/pairtest/lib/TicketTypeRequest.js';
import SeatReservationService from '../../src/thirdparty/seatbooking/SeatReservationService.js';
import TicketPaymentService from '../../src/thirdparty/paymentgateway/TicketPaymentService.js';

const {expect} = chai;
chai.use(sinonChai);

describe('TicketService', () => {
  let ticketService = null;
  let reserveSeatStub = null;
  let processPaymentStub = null;
  let accountId = 1234;

  beforeEach(() => {
    reserveSeatStub = sinon.stub(SeatReservationService.prototype, 'reserveSeat');
    processPaymentStub = sinon.stub(TicketPaymentService.prototype, 'makePayment');
    
    ticketService = new TicketService();
  })

  afterEach(() => {
    sinon.restore();
  });

  it('should call TicketPaymentService and SeatReservationService for valid purchase requests', () => {
    ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 12));
    expect(processPaymentStub.calledWithExactly(accountId, 240)).to.be.true;
    expect(reserveSeatStub.calledWithExactly(accountId, 12)).to.be.true;

    ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 12), new TicketTypeRequest('CHILD', 4), new TicketTypeRequest('INFANT', 4));
    expect(processPaymentStub.calledWithExactly(accountId, 280)).to.be.true;
    expect(reserveSeatStub.calledWithExactly(accountId, 16)).to.be.true;
  })

  it('should make sure that infants do not pay for a ticket and are not allocated a seat', () => {
    ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 10), new TicketTypeRequest('INFANT', 5));
    expect(processPaymentStub.calledOnceWithExactly(accountId, 200)).to.be.true;
    expect(reserveSeatStub.calledOnceWithExactly(accountId, 10)).to.be.true;
  })

  it('should reject purchases of child and infant tickets without an accompanying adult ticket', () => {    
    expect(() => {
      ticketService.purchaseTickets(accountId, new TicketTypeRequest('INFANT', 3));
    }).to.throw('Child and Infant tickets cannot be purchased without purchasing an Adult ticket') 
  })

  it('should reject purchases of more than 20 tickets', () => {
    expect(() => {
      ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 12), new TicketTypeRequest('CHILD', 10));
    }).to.throw('Only a maximum of 20 tickets can be purchased at once');

    expect(() => {
      ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 1), new TicketTypeRequest('INFANT', 50));
    }).to.throw('Only a maximum of 20 tickets can be purchased at once');
  })

  it('should reject purchases with an invalid accountId', () => {
    expect(() => {
      ticketService.purchaseTickets(-123, new TicketTypeRequest('ADULT', 12));
    }).to.throw('AccountId must be a non-negative number');

    expect(() => {
      ticketService.purchaseTickets('asdfasdfsadfsadf', new TicketTypeRequest('ADULT', 12));
    }).to.throw('AccountId must be a non-negative number');

    expect(() => {
      ticketService.purchaseTickets([], new TicketTypeRequest('ADULT', 5));
    }).to.throw('AccountId must be a non-negative number');

    expect(() => {
      ticketService.purchaseTickets({}, new TicketTypeRequest('ADULT', 5));
    }).to.throw('AccountId must be a non-negative number');
  })

  it(`should reject purchases with non standard ticket type requests`, () => {
    expect(() => {
      ticketService.purchaseTickets(accountId, {nonstandard: 'request'});
    }).to.throw('One or more ticket requests are not valid.');

    expect(() => {
      ticketService.purchaseTickets(accountId, ['aNonStandardTicketRequest']);
    }).to.throw('One or more ticket requests are not valid.');
  })
})
