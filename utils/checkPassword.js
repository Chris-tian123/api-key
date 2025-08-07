export default function checkPassword(req, res) {
  const auth = req.headers.authorization;
  const token = auth?.split(' ')[1];

  if (token !== process.env.ADMIN_PASSWORD) {
    res.status(403).json({ error: 'Forbidden: Invalid Auth Password' });
    return false;
  }

  return true;
}