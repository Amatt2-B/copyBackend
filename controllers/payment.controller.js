const factory = require('./handlerFactory.controller');
const Payment = require('../models/payments.model');

exports.getAllPayments = factory.getAll(Payment);
exports.getPayment = factory.getOne(Payment);
exports.createPayment = factory.createOne(Payment);
