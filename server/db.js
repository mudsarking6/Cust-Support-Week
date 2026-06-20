import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import bcrypt from 'bcryptjs';

mkdirSync('data', { recursive: true });
export const db = new DatabaseSync('data/sports-week.db');
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

const games = ['Cricket','Football','Basketball','Volleyball','Races (Relay Race)','Javelin Throw','Shot Put','Disc Throw','Ground Tennis (Singles)','Table Tennis (Singles)','Badminton (Singles)','Chess','Squash (Singles)','Snooker','Ground Tennis (Doubles)','Table Tennis (Doubles)','Badminton (Doubles)','Squash (Doubles)','Tug of War'];

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, base_role TEXT NOT NULL CHECK(base_role IN ('SUPER_ADMIN','HOD','TEACHER')), department TEXT DEFAULT 'Faculty of Computing', phone TEXT, status TEXT DEFAULT 'ACTIVE', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT DEFAULT '', status TEXT DEFAULT 'ACTIVE', created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(created_by) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id INTEGER NOT NULL, assignment_role TEXT NOT NULL, game_id INTEGER, assigned_by INTEGER NOT NULL, status TEXT DEFAULT 'ACTIVE', assigned_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(teacher_id) REFERENCES users(id), FOREIGN KEY(game_id) REFERENCES games(id), FOREIGN KEY(assigned_by) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS sheets (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, game_id INTEGER NOT NULL, submitted_by INTEGER NOT NULL, status TEXT DEFAULT 'DRAFT', notes TEXT DEFAULT '', file_name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, submitted_at TEXT, FOREIGN KEY(game_id) REFERENCES games(id), FOREIGN KEY(submitted_by) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS student_records (id INTEGER PRIMARY KEY AUTOINCREMENT, student_name TEXT NOT NULL, registration_no TEXT NOT NULL, department TEXT NOT NULL, semester TEXT, section TEXT, contact_no TEXT, game_id INTEGER NOT NULL, remarks TEXT DEFAULT '', added_by INTEGER NOT NULL, sheet_id INTEGER NOT NULL, FOREIGN KEY(game_id) REFERENCES games(id), FOREIGN KEY(added_by) REFERENCES users(id), FOREIGN KEY(sheet_id) REFERENCES sheets(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'INFO', is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS forwards (id INTEGER PRIMARY KEY AUTOINCREMENT, sheet_id INTEGER NOT NULL, forwarded_by INTEGER NOT NULL, forwarded_to INTEGER, audience TEXT DEFAULT 'USER', message TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(sheet_id) REFERENCES sheets(id), FOREIGN KEY(forwarded_by) REFERENCES users(id), FOREIGN KEY(forwarded_to) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, recipient_id INTEGER NOT NULL, message TEXT DEFAULT '', attachment_name TEXT, attachment_url TEXT, attachment_type TEXT, is_seen INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(sender_id) REFERENCES users(id), FOREIGN KEY(recipient_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS sheet_deletions (sheet_id INTEGER NOT NULL, user_id INTEGER NOT NULL, deleted_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(sheet_id,user_id), FOREIGN KEY(sheet_id) REFERENCES sheets(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS terms (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, status TEXT DEFAULT 'ARCHIVED', created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(created_by) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS term_teacher_records (id INTEGER PRIMARY KEY AUTOINCREMENT, term_id INTEGER NOT NULL, teacher_name TEXT NOT NULL, email TEXT, department TEXT, base_role TEXT DEFAULT 'TEACHER', assigned_role TEXT, game_name TEXT, remarks TEXT DEFAULT '', FOREIGN KEY(term_id) REFERENCES terms(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS term_student_records (id INTEGER PRIMARY KEY AUTOINCREMENT, term_id INTEGER NOT NULL, student_name TEXT NOT NULL, registration_no TEXT NOT NULL, department TEXT NOT NULL, semester TEXT, section TEXT, contact_no TEXT, game_name TEXT, remarks TEXT DEFAULT '', FOREIGN KEY(term_id) REFERENCES terms(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS term_forwards (id INTEGER PRIMARY KEY AUTOINCREMENT, term_id INTEGER NOT NULL, forwarded_by INTEGER NOT NULL, forwarded_to INTEGER NOT NULL, message TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(term_id,forwarded_to), FOREIGN KEY(term_id) REFERENCES terms(id) ON DELETE CASCADE, FOREIGN KEY(forwarded_by) REFERENCES users(id), FOREIGN KEY(forwarded_to) REFERENCES users(id));
  `);
  const notificationColumns = new Set(db.prepare('PRAGMA table_info(notifications)').all().map(column=>column.name));
  if(!notificationColumns.has('sender_id')) db.exec('ALTER TABLE notifications ADD COLUMN sender_id INTEGER');
  if(!notificationColumns.has('target_url')) db.exec("ALTER TABLE notifications ADD COLUMN target_url TEXT DEFAULT '/notifications'");
  db.exec('DELETE FROM notifications WHERE sender_id IS NOT NULL AND sender_id=user_id');
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS one_active_support_coordinator ON assignments(assignment_role) WHERE assignment_role='SUPPORT_COORDINATOR' AND status='ACTIVE'");
  const count = db.prepare('SELECT COUNT(*) count FROM users').get().count;
  if (!count) seed();
  seedTermArchive();
}

export function seed() {
  const hash = bcrypt.hashSync('Password123!', 10);
  const addUser = db.prepare('INSERT OR IGNORE INTO users (name,email,password_hash,base_role,department,phone) VALUES (?,?,?,?,?,?)');
  addUser.run('System Administrator','admin@cust.edu.pk',hash,'SUPER_ADMIN','Administration','051-111-555-666');
  addUser.run('Dr. Ayesha Khan','hod@cust.edu.pk',hash,'HOD','Faculty of Computing','0300-1234567');
  ['Ali Raza','Shayan Ahmed','Hamza Malik','Bilal Hassan','Sara Iqbal','Areeba Noor'].forEach((name,i) => addUser.run(name,`${name.toLowerCase().replace(' ','.')}@cust.edu.pk`,hash,'TEACHER', i > 3 ? 'Management Sciences' : 'Faculty of Computing',`0300-55500${i+1}`));
  const admin = db.prepare("SELECT id FROM users WHERE base_role='SUPER_ADMIN'").get();
  const insertGame = db.prepare('INSERT OR IGNORE INTO games (name,description,created_by) VALUES (?,?,?)');
  games.forEach(name => insertGame.run(name, `Official ${name} event for CUST Sports Week`, admin.id));
  const hod = db.prepare("SELECT id FROM users WHERE base_role='HOD'").get();
  const ali = db.prepare("SELECT id FROM users WHERE name='Ali Raza'").get();
  db.prepare("INSERT INTO assignments (teacher_id,assignment_role,assigned_by) SELECT ?, 'SUPPORT_COORDINATOR', ? WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE assignment_role='SUPPORT_COORDINATOR' AND status='ACTIVE')").run(ali.id,hod.id);
  notify(ali.id,'New role assigned','You have been assigned as Support Coordinator by the HOD.','ASSIGNMENT');
}

function seedTermArchive(){
  const admin=db.prepare("SELECT id FROM users WHERE base_role='SUPER_ADMIN' LIMIT 1").get();
  if(!admin)return;
  const termDefinitions=[['261','Spring 2026','CURRENT'],['253','Fall 2025','ARCHIVED'],['251','Spring 2025','ARCHIVED'],['243','Fall 2024','ARCHIVED'],['241','Spring 2024','ARCHIVED'],['233','Fall 2023','ARCHIVED'],['231','Spring 2023','ARCHIVED']];
  const addTerm=db.prepare('INSERT OR IGNORE INTO terms(code,name,status,created_by) VALUES(?,?,?,?)');
  const addTeacher=db.prepare('INSERT INTO term_teacher_records(term_id,teacher_name,email,department,base_role,assigned_role,game_name,remarks) VALUES(?,?,?,?,?,?,?,?)');
  const addStudent=db.prepare('INSERT INTO term_student_records(term_id,student_name,registration_no,department,semester,section,contact_no,game_name,remarks) VALUES(?,?,?,?,?,?,?,?,?)');
  const teacherNames=['Dr. Ayesha Khan','Ali Raza','Shayan Ahmed','Hamza Malik','Bilal Hassan','Sara Iqbal','Areeba Noor'];
  const games=['Cricket','Football','Volleyball','Badminton (Singles)','Table Tennis (Singles)','Chess','Basketball'];
  const studentNames=['Ahmed Raza','Hassan Ali','Usman Khan','Saad Ahmed','Zain Abbas','Muneeb Tariq','Adeel Shah','Bilal Akram','Hamza Farooq','Daniyal Aslam','Fahad Noor','Talha Iqbal'];
  const departments=['Faculty of Computing','Management Sciences','Engineering'];
  for(let t=0;t<termDefinitions.length;t++){
    const [code,name,status]=termDefinitions[t];addTerm.run(code,name,status,admin.id);
    const term=db.prepare('SELECT id FROM terms WHERE code=?').get(code);
    if(!db.prepare('SELECT COUNT(*) n FROM term_teacher_records WHERE term_id=?').get(term.id).n){
      for(let i=0;i<6;i++){const teacher=teacherNames[(i+t)%teacherNames.length];const support=i===0;const game=support?null:games[(i+t)%games.length];addTeacher.run(term.id,teacher,`${teacher.toLowerCase().replace(/[^a-z]+/g,'.').replace(/^\.|\.$/g,'')}@cust.edu.pk`,departments[(i+t)%departments.length],i===0&&t%2===0?'HOD':'TEACHER',support?'Support Coordinator':'Game Head',game,support?'Managed Sports Week operations':`Managed ${game}`);}
    }
    if(!db.prepare('SELECT COUNT(*) n FROM term_student_records WHERE term_id=?').get(term.id).n){
      for(let i=0;i<10;i++){const student=studentNames[(i+t*2)%studentNames.length];const game=games[(i+t)%games.length];addStudent.run(term.id,student,`${code}-${['BSE','BCS','BBA','BEE'][i%4]}-${String(101+i+t*10).padStart(3,'0')}`,departments[(i+t)%departments.length],String(2+(i%7)),['A','B','C'][i%3],`03${String(10+t).padStart(2,'0')}-${String(1234500+i+t*20).slice(-7)}`,game,i===0?'Team Captain':i===9?'Reserve player':'Selected player');}
    }
  }
}

export function notify(userId,title,message,type='INFO',senderId=null,targetUrl='/notifications') {
  if(senderId!==null&&Number(userId)===Number(senderId)) return null;
  db.prepare('INSERT INTO notifications (user_id,title,message,type,sender_id,target_url) VALUES (?,?,?,?,?,?)').run(userId,title,message,type,senderId,targetUrl);
}

export const all = (sql, ...params) => db.prepare(sql).all(...params);
export const one = (sql, ...params) => db.prepare(sql).get(...params);
