import {useEffect,useMemo,useState} from 'react';
import {MoreHorizontal,Plus,Search,UserPlus,Users as UsersIcon} from 'lucide-react';
import {api} from '../api';
import {useAuth,useToast} from '../App';
import Modal,{Field} from '../components/Modal';

export default function Users(){
  const {user}=useAuth();
  const flash=useToast();
  const [list,setList]=useState([]);
  const [q,setQ]=useState('');
  const [modal,setModal]=useState(null);
  const isSuper=user.baseRole==='SUPER_ADMIN';
  const isHod=user.baseRole==='HOD';
  const isSupport=user.displayRole==='Support Coordinator';
  const canAssignGame=isHod||isSupport;
  const load=()=>api.get('/users').then(setList);
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>list.filter(x=>(x.name+x.email+x.baseRole+x.department).toLowerCase().includes(q.toLowerCase())),[list,q]);
  const teachers=list.filter(x=>x.baseRole==='TEACHER');
  const currentSupport=list.find(x=>x.supportAssignmentId);

  const save=async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.currentTarget));
    try{
      if(modal?.id) await api.patch(`/users/${modal.id}`,data); else await api.post('/users',data);
      flash(modal?.id?'User updated':'Account created and credentials saved');setModal(null);load();
    }catch(error){flash(error.message,'error')}
  };
  const assign=async(e,type)=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(e.currentTarget));
    try{
      await api.post(type==='support'?'/assignments/support':'/assignments/game',{teacherId:Number(d.teacherId),gameId:Number(d.gameId)});
      flash('Assignment saved');setModal(null);load();
    }catch(error){flash(error.message,'error')}
  };
  const removeSupport=async()=>{if(!currentSupport||!confirm(`Remove ${currentSupport.name} as Support Coordinator?`))return;try{await api.delete(`/assignments/${currentSupport.supportAssignmentId}`);flash('Support Coordinator removed');load()}catch(error){flash(error.message,'error')}};

  return <>
    <PageHead title={isSuper?'Account management':'People & assignments'} text={isSuper?'Create and manage the login accounts used by HODs and teachers.':'View faculty and manage Sports Week responsibilities.'}>
      {isSuper&&<button className="primary" onClick={()=>setModal({type:'user'})}><Plus/> Add user</button>}
    </PageHead>
    <div className="summary-strip">
      <div><UsersIcon/><span><b>{list.length}</b>Total accounts</span></div>
      <div><UserPlus/><span><b>{teachers.length}</b>Teachers</span></div>
      {isHod&&(currentSupport?<div className="current-support"><span><b>{currentSupport.name}</b>Support Coordinator</span><button onClick={removeSupport}>Remove</button></div>:<button className="secondary" onClick={()=>setModal({type:'support'})}>Assign support coordinator</button>)}
      {canAssignGame&&<button className="secondary" onClick={()=>setModal({type:'game'})}>Assign game head</button>}
    </div>
    <section className="panel table-panel">
      <div className="toolbar"><div className="search"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, email, role, or department…"/></div><span><b>{filtered.length}</b> people found</span></div>
      <div className="table-wrap"><table className="people-table"><thead><tr><th>Faculty member</th><th>Base role</th><th>Department</th>{!isSuper&&<th>Assignment</th>}<th>Status</th><th></th></tr></thead><tbody>{filtered.map(x=><tr className="people-row" key={x.id}>
        <td><div className="faculty-identity"><i>{x.name.split(' ').map(y=>y[0]).slice(0,2).join('')}</i><p><b>{x.name}</b><span>{x.email}</span></p></div></td>
        <td><span className={`role-badge ${x.baseRole.toLowerCase()}`}>{roleLabel(x.baseRole)}</span></td><td><span className="department-label">{x.department}</span></td>
        {!isSuper&&<td><AssignmentBadges value={x.assignments}/></td>}
        <td><span className={`account-status ${x.status.toLowerCase()}`}><i/>{x.status==='ACTIVE'?'Active':'Inactive'}</span></td>
        <td>{isSuper&&<button className="icon-btn" aria-label={`Edit ${x.name}`} onClick={()=>setModal({type:'user',...x})}><MoreHorizontal/></button>}</td>
      </tr>)}</tbody></table></div>
    </section>
    {modal?.type==='user'&&<UserModal modal={modal} save={save} close={()=>setModal(null)}/>} 
    {isHod&&!currentSupport&&modal?.type==='support'&&<AssignModal title="Assign support coordinator" teachers={teachers} onClose={()=>setModal(null)} onSubmit={e=>assign(e,'support')}/>} 
    {canAssignGame&&modal?.type==='game'&&<GameAssign teachers={teachers} onClose={()=>setModal(null)} onSubmit={e=>assign(e,'game')}/>} 
  </>;
}

function UserModal({modal,save,close}){return <Modal title={modal.id?'Edit login account':'Create login account'} subtitle="Credentials are securely saved for institutional access." onClose={close}><form className="form-grid" onSubmit={save}>
  <Field label="Full name"><input name="name" defaultValue={modal.name} required/></Field><Field label="University email"><input name="email" type="email" defaultValue={modal.email} required/></Field>
  <Field label="Account role"><select name="baseRole" defaultValue={modal.baseRole||'TEACHER'}><option value="TEACHER">Teacher</option><option value="HOD">HOD</option></select></Field><Field label="Department"><input name="department" defaultValue={modal.department||'Faculty of Computing'}/></Field>
  <Field label="Phone"><input name="phone" defaultValue={modal.phone}/></Field><Field label={modal.id?'New password (optional)':'Temporary password'}><input name="password" type="password" required={!modal.id} defaultValue={modal.id?'':'Password123!'}/></Field>
  {modal.id&&<Field label="Account status"><select name="status" defaultValue={modal.status}><option>ACTIVE</option><option>INACTIVE</option></select></Field>}<Actions close={close}/>
  </form></Modal>}
function PageHead({title,text,children}){return <div className="page-head"><div><p className="eyebrow">ADMINISTRATION</p><h1>{title}</h1><p>{text}</p></div>{children}</div>}
function roleLabel(role){return role==='SUPER_ADMIN'?'Super Admin':role==='HOD'?'Head of Department':'Teacher'}
function AssignmentBadges({value}){if(!value)return <span className="no-assignment">No active assignment</span>;return <div className="assignment-tags">{value.split(',').map((assignment,index)=>{const label=assignment.trim();return <span className={label==='Support Coordinator'?'assignment-tag support':'assignment-tag game'} key={`${label}-${index}`}>{label}</span>})}</div>}
function Actions({close}){return <div className="form-actions wide"><button type="button" className="ghost" onClick={close}>Cancel</button><button className="primary">Save changes</button></div>}
function AssignModal({title,teachers,onClose,onSubmit}){return <Modal title={title} subtitle="This increases the selected teacher’s permissions." onClose={onClose}><form className="form-grid" onSubmit={onSubmit}><Field label="Faculty member" wide><select name="teacherId" required><option value="">Select a teacher</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name} · {t.department}</option>)}</select></Field><Actions close={onClose}/></form></Modal>}
function GameAssign({teachers,onClose,onSubmit}){const[games,setGames]=useState([]);useEffect(()=>{api.get('/games').then(setGames)},[]);return <Modal title="Assign game head" subtitle="A game can have one or more game heads." onClose={onClose}><form className="form-grid" onSubmit={onSubmit}><Field label="Faculty member" wide><select name="teacherId" required><option value="">Select a teacher</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field><Field label="Game" wide><select name="gameId" required><option value="">Select a game</option>{games.filter(g=>g.status==='ACTIVE').map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></Field><Actions close={onClose}/></form></Modal>}
