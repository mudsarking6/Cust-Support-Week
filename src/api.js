const API='/api';
export async function request(path,options={}){
  const token=localStorage.getItem('cust_token');
  const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...options.headers};
  if(token)headers.Authorization=`Bearer ${token}`;
  const res=await fetch(API+path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){if(res.status===401){localStorage.removeItem('cust_token');localStorage.removeItem('cust_user');}throw new Error(data.message||'Request failed');}
  return data;
}
async function download(path,fallbackName='export.xlsx'){
  const token=localStorage.getItem('cust_token');
  const res=await fetch(API+path,{headers:{Authorization:`Bearer ${token}`}});
  if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.message||'Download failed')}
  const disposition=res.headers.get('content-disposition')||'';const name=disposition.match(/filename="?([^";]+)"?/)?.[1]||fallbackName;
  const url=URL.createObjectURL(await res.blob());const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
}
export const api={get:p=>request(p),post:(p,b)=>request(p,{method:'POST',body:b instanceof FormData?b:JSON.stringify(b)}),patch:(p,b)=>request(p,{method:'PATCH',body:JSON.stringify(b)}),delete:p=>request(p,{method:'DELETE'}),download};
