import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ChevronLeft,ChevronRight,Eye,EyeOff,LockKeyhole,ShieldCheck} from 'lucide-react';
import {api} from '../api';
import {useAuth} from '../App';
import '../login-carousel.css';

const sportsMoments=[
  {src:'/login-carousel/football.jpeg',title:'Football',caption:'Every pass builds the team.'},
  {src:'/login-carousel/tug-men.jpeg',title:'Tug of War',caption:'Strength is better together.'},
  {src:'/login-carousel/cricket.jpeg',title:'Cricket',caption:'Ready for the next big shot.'},
  {src:'/login-carousel/javelin.jpeg',title:'Javelin Throw',caption:'Focus. Power. Flight.'},
  {src:'/login-carousel/basketball.jpeg',title:'Basketball',caption:'Rise above the competition.'},
  {src:'/login-carousel/tug-women.jpeg',title:"Women's Tug of War",caption:'One rhythm. One team.'},
  {src:'/login-carousel/volleyball-serve.jpeg',title:'Volleyball',caption:'Own every serve.'},
  {src:'/login-carousel/volleyball-spike.jpeg',title:'Volleyball',caption:'Meet the moment at the net.'}
];

function SportsCarousel(){
  const [current,setCurrent]=useState(0);const [previous,setPrevious]=useState(null);const [direction,setDirection]=useState('forward');const [paused,setPaused]=useState(false);
  const move=(index,nextDirection='forward')=>{if(index===current)return;setPrevious(current);setDirection(nextDirection);setCurrent(index)};
  const next=()=>move((current+1)%sportsMoments.length,'forward');
  const back=()=>move((current-1+sportsMoments.length)%sportsMoments.length,'backward');
  useEffect(()=>{if(paused)return;const timer=setInterval(next,2000);return()=>clearInterval(timer)},[current,paused]);
  return <div className="sports-carousel" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false)}} aria-roledescription="carousel" aria-label="CUST Sports Week moments">
    <div className="carousel-viewport">
      {sportsMoments.map((moment,index)=><figure key={moment.src} className={`carousel-slide ${index===current?`active ${direction}`:''} ${index===previous&&index!==current?`leaving ${direction}`:''}`} aria-hidden={index!==current}>
        <img src={moment.src} alt={index===current?`${moment.title} at CUST Sports Week`:''}/>
        <figcaption><span>SPORTS WEEK MOMENT</span><strong>{moment.title}</strong><p>{moment.caption}</p></figcaption>
      </figure>)}
      <div className="carousel-shade"/>
      <div className="carousel-arrows">
        <button type="button" onClick={back} aria-label="Previous sports moment"><ChevronLeft/></button>
        <button type="button" onClick={next} aria-label="Next sports moment"><ChevronRight/></button>
      </div>
    </div>
  </div>
}

export default function Login(){
  const{login}=useAuth();const[email,setEmail]=useState('admin@cust.edu.pk');const[password,setPassword]=useState('Password123!');const[show,setShow]=useState(false);const[error,setError]=useState('');const[busy,setBusy]=useState(false);
  const submit=async event=>{event.preventDefault();setBusy(true);setError('');try{const data=await api.post('/auth/login',{email,password});login(data.token,data.user)}catch(error){setError(error.message)}finally{setBusy(false)}};
  return <div className="login-page"><section className="login-visual"><div className="visual-inner"><div className="uni"><img src="/cust-logo.jpg"/><span>Capital University of<br/>Science &amp; Technology</span></div><div className="hero-copy"><div className="hero-heading"><p className="eyebrow">CUST SPORTS WEEK</p><h1>One team. <em>Every game.</em></h1></div><SportsCarousel/></div><div className="security"><ShieldCheck/><div><b>Institutional access only</b><span>Protected with role-based permissions</span></div></div></div></section><section className="login-form-wrap"><form onSubmit={submit}><div className="mobile-logo"><img src="/cust-logo.jpg"/><b>CUST Sports Week</b></div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p className="muted">Use the credentials issued by the system administrator.</p>{error&&<div className="error-box">{error}</div>}<label><span>University email</span><input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@cust.edu.pk" required/></label><label><span>Password</span><div className="password"><input type={show?'text':'password'} value={password} onChange={event=>setPassword(event.target.value)} required/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label><button className="primary login-btn" disabled={busy}>{busy?'Signing in…':'Sign in securely'}<ArrowRight/></button><div className="demo-note"><LockKeyhole/><p><b>Demo access</b><span>admin@cust.edu.pk · Password123!</span></p></div><small className="copyright">© 2026 Capital University of Science &amp; Technology</small></form></section></div>;
}
