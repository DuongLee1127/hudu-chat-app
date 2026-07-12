import { Router } from 'express';
import friendController from '@/controllers/friendController';
import { authMiddleware } from '@/middlewares/authMiddleware';

const router = Router();

router.get('/me', authMiddleware, friendController.getFriends);
router.get('/me/requests/incoming', authMiddleware, friendController.getIncomingRequests);
router.get('/me/requests/outgoing', authMiddleware, friendController.getOutgoingRequests);
router.post('/:id/request', authMiddleware, friendController.sendRequest);
router.delete('/:id/request', authMiddleware, friendController.respondToOrCancelRequest);
router.post('/:id/accept', authMiddleware, friendController.acceptRequest);
router.delete('/:id', authMiddleware, friendController.unfriend);

export default router;
