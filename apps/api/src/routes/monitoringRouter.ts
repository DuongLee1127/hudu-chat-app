import { Router } from 'express';
import monitoringController from '@/controllers/monitoringController';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check (Mongo + Redis connectivity, uptime)
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Service healthy
 *       503:
 *         description: A dependency is down
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Prometheus-format metrics (process + HTTP request counter)
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Metrics in Prometheus text format
 */

router.get('/health', monitoringController.health);
router.get('/metrics', monitoringController.metrics);

export default router;
