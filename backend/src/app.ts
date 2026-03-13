import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { authRoutes } from './modules/auth/auth.routes';
import { invoiceRoutes } from './modules/invoice/invoice.routes';
import { paymentRoutes } from './modules/payment/payment.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { corsOptions } from './config/cors';

const app = express();

app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
