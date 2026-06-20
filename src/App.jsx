import React,{createContext,useContext,useEffect,useState} from 'react';
import {Navigate,Route,Routes,useLocation,useNavigate} from 'react-router-dom';
import {api} from './api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Games from './pages/Games';
import Sheets from './pages/Sheets';
import SheetDetail from './pages/SheetDetail';
import Notifications from './pages/Notifications';
import Reminders from './pages/Reminders';
import Terms from './pages/Terms';

const Auth=createContext(); export const useAuth=()=>useContext(Auth);
export const Toast=createContext(); export const useToast=()=>useContext(Toast);
function Guard({children}){const {user,loading}=useAuth();if(loading)return <div className="app-loader"><span></span><p>Preparing your workspace…</p></div>;return user?children:<Navigate to="/login" replace/>}
export default function App(){
 const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('cust_user')||'null'));const[loading,setLoading]=useState(!!localStorage.getItem('cust_token'));const[toast,setToast]=useState(null);
 useEffect(()=>{if(!loading)return;api.get('/auth/me').then(setUser).catch(()=>setUser(null)).finally(()=>setLoading(false))},[]);
 const login=(token,u)=>{localStorage.setItem('cust_token',token);localStorage.setItem('cust_user',JSON.stringify(u));setUser(u)};const logout=()=>{localStorage.clear();setUser(null)};
 const flash=(message,type='success')=>{setToast({message,type});setTimeout(()=>setToast(null),3200)};
 const operational=user?.baseRole!=='SUPER_ADMIN';
 return <Auth.Provider value={{user,login,logout,loading}}><Toast.Provider value={flash}>{toast&&<div className={`toast ${toast.type}`}>{toast.message}</div>}<Routes><Route path="/login" element={user?<Navigate to="/"/>:<Login/>}/><Route path="/*" element={<Guard><Layout><Routes><Route index element={<Dashboard/>}/><Route path="users" element={<Users/>}/><Route path="games" element={operational?<Games/>:<Navigate to="/users" replace/>}/><Route path="sheets" element={operational?<Sheets/>:<Navigate to="/users" replace/>}/><Route path="sheets/:id" element={operational?<SheetDetail/>:<Navigate to="/users" replace/>}/><Route path="terms" element={operational?<Terms/>:<Navigate to="/users" replace/>}/><Route path="terms/:id" element={operational?<Terms/>:<Navigate to="/users" replace/>}/><Route path="reminders" element={operational?<Reminders/>:<Navigate to="/users" replace/>}/><Route path="notifications" element={<Notifications/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></Layout></Guard>}/></Routes></Toast.Provider></Auth.Provider>
}
