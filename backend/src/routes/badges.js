const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');
const { getUnlockedBadges, checkAndUnlockBadges, calculateStreak } = require('../db/badgeService');

const router = express.Router();
router.use(requireAuth);

router.get('/', ah(async (req, res) => {
  const unlocked = getUnlockedBadges(req.user.id);
  res.json({ unlocked: unlocked.map(b => b.badge_id), streak: calculateStreak(req.user.id) });
}));

router.post('/check', ah(async (req, res) => {
  const newBadges = checkAndUnlockBadges(req.user.id);
  res.json({ newBadges });
}));

module.exports = router;
