(() => {
const $=id=>document.getElementById(id), bucket="riaa";
const url=window.SUPABASE_URL,key=window.SUPABASE_PUBLISHABLE_KEY;
const configured=url&&key&&!url.includes("PASTE_")&&!key.includes("PASTE_");
const setMsg=(id,s)=>$(id).textContent=s;
const show=ok=>{$("login").classList.toggle("hidden",ok);$("galleryPage").classList.toggle("hidden",!ok)};
if(!configured){setMsg("loginMsg","Setup needed: fill in config.js with your Supabase URL and publishable key.");$("loginForm").addEventListener("submit",e=>e.preventDefault());return}
const db=window.supabase.createClient(url,key);
async function refresh(){
const {data,error}=await db.storage.from(bucket).list("",{limit:100,sortBy:{column:"created_at",order:"desc"}});
if(error){setMsg("galleryMsg","Could not load gallery: "+error.message);return}
const gallery=$("gallery");gallery.replaceChildren();const items=(data||[]).filter(x=>x.name&&!x.name.startsWith("."));
$("count").textContent=items.length+" memories";
for(const f of items){const {data:signed,error:se}=await db.storage.from(bucket).createSignedUrl(f.name,300);if(se)continue;
const card=document.createElement("article");card.className="memory";const img=document.createElement("img");img.src=signed.signedUrl;img.alt="A memory";img.loading="lazy";
const cap=document.createElement("div");cap.className="caption";cap.textContent=f.name.replace(/^\d+-/,"").replace(/\.[^.]+$/,"").replace(/[-_]/g," ")||"A memory ♡";
const del=document.createElement("button");del.className="delete";del.textContent="Remove photo";del.onclick=async()=>{if(confirm("Remove this photo?")){const {error}=await db.storage.from(bucket).remove([f.name]);setMsg("galleryMsg",error?error.message:"Photo removed ♡");if(!error)refresh()}};
card.append(img,cap,del);gallery.append(card)}
if(!items.length)setMsg("galleryMsg","No memories yet. Add your first photo above.")
}
$("loginForm").onsubmit=async e=>{e.preventDefault();setMsg("loginMsg","Signing in…");const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){setMsg("loginMsg",error.message);return}show(true);refresh()};
$("uploadForm").onsubmit=async e=>{e.preventDefault();const f=$("photo").files[0];if(!f)return;if(f.size>5*1024*1024){setMsg("uploadMsg","Please choose a photo under 5 MB.");return}if(!["image/jpeg","image/png","image/webp","image/gif"].includes(f.type)){setMsg("uploadMsg","Choose a JPG, PNG, WEBP, or GIF.");return}$("uploadBtn").disabled=true;setMsg("uploadMsg","Uploading…");const label=$("caption").value.trim().replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,50);const path=Date.now()+"-"+(label||f.name.replace(/[^a-zA-Z0-9._-]/g,"-"));const {error}=await db.storage.from(bucket).upload(path,f,{contentType:f.type});$("uploadBtn").disabled=false;if(error){setMsg("uploadMsg","Upload failed: "+error.message);return}$("uploadForm").reset();setMsg("uploadMsg","Memory added ♡");refresh()};
$("logout").onclick=async()=>{await db.auth.signOut();show(false)};
db.auth.getSession().then(async({data})=>{if(data.session){show(true);refresh()}});
})();