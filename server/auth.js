import jwt from 'jsonwebtoken';
import { one } from './db.js';

const secret = process.env.JWT_SECRET || 'cust-sports-week-development-secret';
export const signToken = user => jwt.sign({ id:user.id, role:user.base_role }, secret, { expiresIn:'12h' });
export function auth(req,res,next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ','');
    if (!token) return res.status(401).json({ message:'Authentication required' });
    const data = jwt.verify(token,secret);
    const user = one('SELECT id,name,email,base_role,department,phone,status FROM users WHERE id=?',data.id);
    if (!user || user.status !== 'ACTIVE') return res.status(401).json({ message:'Account is unavailable' });
    req.user=user; next();
  } catch { res.status(401).json({ message:'Session expired. Please sign in again.' }); }
}
export const allow = (...roles) => (req,res,next) => roles.includes(req.user.base_role) ? next() : res.status(403).json({ message:'You do not have permission for this action' });
export function coordinator(req,res,next) {
  if (req.user.base_role === 'HOD') return next();
  const assignment = one("SELECT id FROM assignments WHERE teacher_id=? AND status='ACTIVE'",req.user.id);
  return assignment ? next() : res.status(403).json({message:'Coordinator assignment required'});
}

export function supportOrHod(req,res,next) {
  if (req.user.base_role === 'HOD') return next();
  const assignment = one("SELECT id FROM assignments WHERE teacher_id=? AND assignment_role='SUPPORT_COORDINATOR' AND status='ACTIVE'",req.user.id);
  return assignment ? next() : res.status(403).json({message:'HOD or Support Coordinator permission required'});
}

export function supportOnly(req,res,next) {
  const assignment = one("SELECT id FROM assignments WHERE teacher_id=? AND assignment_role='SUPPORT_COORDINATOR' AND status='ACTIVE'",req.user.id);
  return assignment ? next() : res.status(403).json({message:'Support Coordinator permission required'});
}

export function operational(req,res,next) {
  if (req.user.base_role === 'SUPER_ADMIN') return res.status(403).json({message:'Super Admin access is limited to account management'});
  next();
}
