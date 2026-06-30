/* ============================================================
   Sagan Presentation builder — mirrors rt-builder output.
   Per candidate: fetch CV -> Claude structures it + writes AI notes
   in Jesus's voice -> anonymize (first name only; strip last name,
   email, phone, LinkedIn) -> render same card structure with CV inline.
   READ-ONLY on data; only write is an explicit, confirmed GitHub publish.
   ============================================================ */
const SAGAN_LOGO='https://saganrecruitment.com/wp-content/uploads/2025/10/Sagan-Logo-2-e1759568299542.png';
const GH_ORG='wg-dotcom';
const CLAUDE_MODEL_PRES='claude-sonnet-4-6';

// Talent Advisor directory (same as rt-builder) — picked per presentation.
const ADVISORS = {
  jesus:{name:'Jesus Pacheco', role:'Sagan · Head of Revenue', photo:'', summary:'Jesus leads Revenue at Sagan and personally oversees this search. He is your direct point of contact for scheduling interviews and coordinating next steps.'},
  priscilla:{name:'Priscilla Montenegro', role:'Sagan · Recruitment Team — Team Lead', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Priscilla-.jpeg', summary:'Priscilla, Team Lead at Sagan, holds a Psychology degree and 5+ years of recruitment experience. She is your direct point of contact for this search.'},
  manuel:{name:'Manuel Jaramillo', role:'Sagan · Recruitment Team — Team Lead', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Manuel.webp', summary:'Manuel, a Recruitment Team Lead, manages a talented team of tech, marketing, and creative recruiters. He is your direct point of contact for this search.'},
  andrea:{name:'Andrea Mendoza', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Andrea-M-.jpeg', summary:'Andrea is a bilingual talent expert who combines her legal background with HR know-how. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  andres:{name:'Andrés Cardozo', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Andres-David-Cardozo.jpeg', summary:'Andrés helps companies find and connect with exceptional talent. He is your direct point of contact for scheduling interviews and coordinating next steps.'},
  jessica:{name:'Jessica Lacdao', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Jessica-Arra-.jpeg', summary:'Jessica brings 8+ years of experience in the US market. Part recruiter, part problem-solver. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  noel:{name:'Noel Balderama', role:'Sagan · Recruitment Team — Technical Recruiter', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Noel-Balderama.webp', summary:'Noel is a seasoned Technical Recruiter specializing in IT recruitment and ATS proficiency. He is your direct point of contact for scheduling interviews and coordinating next steps.'},
  psy:{name:'Psy Mallorca', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Psyden-Kelly-Mallorca-.jpeg', summary:'Psy connects outstanding global talent with top executives and companies. He is your direct point of contact for scheduling interviews and coordinating next steps.'},
  genesis:{name:'Genesis Torrealba', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2026/01/Genesis.png', summary:'Genesis brings warmth, patience, and a people-focused approach to talent advisory. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  vicky:{name:'Vicky Martinez', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/10/Vicky-Martinez.jpeg', summary:'Vicky has over four years of experience building talent pipelines and conducting screenings. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  cami:{name:'Cami Poloche', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/08/Camilla-.jpg', summary:'Cami is passionate about connecting top talent with the right opportunities. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  caroline:{name:'Caroline Muraya', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/10/Caroline-Muraya.jpeg', summary:'Caroline is an end-to-end Talent Advisor skilled in driving all stages of the talent acquisition lifecycle. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  amimo:{name:'Amimo Chaka', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2025/10/Amimo.jpg', summary:'Amimo helps high-growth companies find and hire exceptional remote talent across Africa, Asia, and Latin America. She is your direct point of contact for scheduling interviews and coordinating next steps.'},
  nadeia:{name:'Nadeia Campbell', role:'Sagan · Recruitment Team — Talent Advisor', photo:'https://saganrecruitment.com/wp-content/uploads/2026/03/image-1.png', summary:'Nadeia brings a background in sales and recruiting with a relationship-driven approach. She is your direct point of contact for scheduling interviews and coordinating next steps.'}
};

function pesc(s){return (s==null?'':''+s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function initials(n){return (n||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'•'}
function firstNameOf(n){return (n||'').trim().split(/\s+/)[0]||''}
function lastTokens(n){return (n||'').trim().split(/\s+/).slice(1).filter(w=>w.length>1);}
function fmtDate(d){try{return new Date(d+(d&&d.length<=10?'T12:00:00':'')).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}catch(e){return d||''}}
function slugify(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}

/* ---------- anonymization ---------- */
function anonymize(text, lastNameTokens){
  if(!text) return '';
  let t=''+text;
  t=t.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,'');                       // emails
  t=t.replace(/\bhttps?:\/\/\S+/gi,'').replace(/\b(?:www\.)?linkedin\.com\/\S+/gi,''); // urls / linkedin
  t=t.replace(/(\+?\d{1,3}[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/g,''); // phone numbers
  (lastNameTokens||[]).forEach(ln=>{ if(ln && ln.length>1) t=t.replace(new RegExp('\\b'+ln.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi'),''); });
  return t.replace(/\s{2,}/g,' ').replace(/\s+([,.;:])/g,'$1').trim();
}

/* ---------- Jesus's voice (mirrors rt-builder) ---------- */
const VOICE=`You are Jesus Pacheco, Head of Revenue at Sagan Recruitment. You present candidates to US companies (we call them "members", never "clients") like a sommelier presents wine. Make the member FEEL why this person fits, don't just list qualifications.
WHO YOU ARE: MIT Supply Chain master's. Telecom engineer from Venezuela. Based in Mendoza, Argentina. You think in systems, sell with stories, and write like you talk. You are a real person who vetted this candidate personally.
YOUR WRITING DNA:
- Short sentences. Punchy rhythm. Human, natural, C1 English. Never sounds AI-generated or corporate.
- NEVER use em dashes as connectors. Use periods, commas, or colons.
- NEVER use: "leveraging","synergy","best-in-class","proven track record","dynamic","passionate about","extensive experience","well-versed","seasoned professional","boasts","adept at". These = instant delete.
- Lead with SPECIFICS: tool names, years, certifications, numbers. This is a SELECTION RATIONALE: confident and positive, why this person earned a spot on the shortlist. Do NOT flag weaknesses, gaps, concerns, or downsides.
SOMMELIER FLAIR (weave 1-2 naturally, vary per candidate): "the adult in the room","sleep-easy-at-night hire","operator mindset","Swiss Army knife","builder DNA","worth every penny","calculated risk worth taking","force multiplier","the glue person".`;

/* ---------- resume fetch + extract ---------- */
let _pdfjs=null;
async function pdfjs(){ if(_pdfjs) return _pdfjs;
  try{ const m=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    m.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'; _pdfjs=m; return m;
  }catch(e){ return null; } }
function driveDirect(url){
  let m=url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)||url.match(/[?&]id=([\w-]+)/);
  return m?`https://drive.google.com/uc?export=download&id=${m[1]}`:url;
}
function cvProxy(){ try{return (localStorage.getItem('sm_cvproxy')||'').trim()}catch(e){return ''} }
async function fetchBytes(purl, isJson){
  const r=await fetch(purl,{signal:AbortSignal.timeout(7000)});
  if(!r.ok) throw new Error('bad');
  if(isJson){ const d=await r.json(); const c=d.contents||'';
    if(c.startsWith('data:')){ const b=atob((c.split(',')[1]||'')); const u=new Uint8Array(b.length); for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i); return u; }
    return new TextEncoder().encode(c); }
  return new Uint8Array(await r.arrayBuffer());
}
async function fetchResumeText(url){
  if(!url) return null;
  const target=driveDirect(url.trim()), enc=encodeURIComponent(target);
  const tries=[];
  const up=cvProxy();                       // user-controlled proxy (most reliable) — supports {url} placeholder
  if(up) tries.push(fetchBytes(up.includes('{url}')?up.replace('{url}',enc):up+enc, false));
  tries.push(fetchBytes('https://api.allorigins.win/raw?url='+enc, false));
  tries.push(fetchBytes('https://corsproxy.io/?url='+enc, false));
  tries.push(fetchBytes('https://api.codetabs.com/v1/proxy/?quest='+target, false));
  tries.push(fetchBytes('https://api.allorigins.win/get?url='+enc, true));
  let bytes=null; try{ bytes=await Promise.any(tries); }catch(e){ return null; }   // ~7s max, all in parallel
  if(!bytes||bytes.length<5) return null;
  const head=String.fromCharCode.apply(null, bytes.slice(0,5));
  if(head.startsWith('%PDF')){
    const lib=await pdfjs(); if(!lib) return null;
    try{ const pdf=await lib.getDocument({data:bytes}).promise; let txt='';
      for(let i=1;i<=Math.min(pdf.numPages,8);i++){ const pg=await pdf.getPage(i); const ct=await pg.getTextContent(); txt+=ct.items.map(x=>x.str).join(' ')+'\n'; }
      return txt.trim().length>80?txt.slice(0,9000):null;
    }catch(e){ return null; }
  }
  let s=new TextDecoder('utf-8').decode(bytes);
  if(/<html|<body|<!doctype/i.test(s)){ const d=new DOMParser().parseFromString(s,'text/html'); s=d.body?d.body.innerText:s; }
  return s.trim().length>80?s.slice(0,9000):null;
}

/* ---------- Claude call ---------- */
async function callClaude(prompt,maxTokens){
  const key=getKey('anthropic'); if(!key) throw new Error('Missing Anthropic key (Settings)');
  for(let a=0;a<2;a++){
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:CLAUDE_MODEL_PRES,max_tokens:maxTokens,messages:[{role:'user',content:prompt}]})});
      if(!r.ok){ if(r.status===429||r.status>=500){await new Promise(s=>setTimeout(s,4000));continue;} throw new Error('Claude '+r.status+': '+(await r.text()).slice(0,160)); }
      return (await r.json()).content[0].text;
    }catch(e){ if(a===1) throw e; await new Promise(s=>setTimeout(s,3000)); }
  }
}
function parseJSON(txt){
  let s=txt.replace(/^[\s\S]*?```(?:json)?\s*\n?/i,'').replace(/\n?\s*```[\s\S]*$/,'').trim();
  if(!s.startsWith('{')){ const m=s.match(/\{[\s\S]*\}/); if(m) s=m[0]; }
  return JSON.parse(s);
}

/* ---------- per-candidate processing ---------- */
async function processCandidate(c, opts, resumeText){
  const last=lastTokens(c.name);
  const ctx=`MEMBER (company): ${opts.member} | ROLE: ${opts.role}
ROLE CONTEXT / PAIN POINTS: ${opts.introNote||'(use the JD below)'}
JOB DESCRIPTION:
${(opts.jd||'').slice(0,3500)}

CANDIDATE (refer to them by FIRST NAME ONLY — "${firstNameOf(c.name)}"):
Country: ${c.country||'?'} | Target comp: ${c.tcomp||'?'} | Applied for: ${c.role||'?'}
Our match verdict: ${c.verdict||''} (score ${c.score||'?'})
Why matched: ${(c.reasons||[]).join('; ')}
Profile summary: ${(c.text||'').slice(0,1400)}
${resumeText?'ACTUAL RESUME TEXT (extract job history, education, skills VERBATIM from here):\n'+resumeText:'NOTE: resume file could not be fetched. Use ONLY the profile summary above. Do NOT invent jobs, companies, schools, or certs.'}`;

  const prompt=`${VOICE}

${ctx}

Produce an ANONYMIZED candidate profile + recruiter notes for a presentation to the member.
ANONYMIZATION RULES (critical): Never output the candidate's last name, email, phone number, LinkedIn or any URL, or home address. Refer to them only as "${firstNameOf(c.name)}". Company names, roles, schools, and skills are fine to include.
ACCURACY: Use ONLY facts in the resume text / profile above. Never invent jobs, companies, certs, or metrics.

Return ONLY valid JSON (no markdown):
{
 "experience":[{"role":"Exact title","company":"Company","dates":"Dates as written","description":"Key bullets, newline-separated, verbatim-ish"}],
 "education":[{"degree":"","school":"","year":""}],
 "certifications":["..."],
 "languages":[{"name":"","level":""}],
 "skills":["skill1","skill2","... up to 12"],
 "summary":"2-3 sentence professional summary, first name only",
 "why":["3-5 punchy bullets, each one line <15 words, start with a specific fact — reasons we chose them"],
 "note":"2-3 sentences (<60 words), sommelier voice: why we're excited to put ${firstNameOf(c.name)} forward for THIS role",
 "detailedNote":"3-5 sentences (80-150 words): the CHOOSING RATIONALE — why we picked ${firstNameOf(c.name)} for ${opts.member}. Confident, specific, positive. Do NOT mention weaknesses, gaps, concerns, or trade-offs.",
 "fitIndicators":["[candidate fact] -> [why it matters for ${opts.member}]","...x3"],
 "strengthScores":{"Skill A":88,"Skill B":92,"...6 skills relevant to the role, honest 0-100":80}
}`;
  let d={};
  try{ d=parseJSON(await callClaude(prompt,2600)); }catch(e){ d={summary:c.text||'',why:(c.reasons||[]).slice(0,4),note:c.verdict||'',detailedNote:'',fitIndicators:[],strengthScores:{},experience:[],education:[],certifications:[],languages:[],skills:[]}; }

  // hard anonymization scrub on every rendered field
  const A=(s)=>anonymize(s,last);
  const enriched={
    first:firstNameOf(c.name),
    country:c.country||'', applied:c.role||'', score:c.score, video:c.video||'', comp:(c.tcomp||'').trim(),
    summary:A(d.summary||c.text||''),
    why:(d.why||[]).map(A).filter(Boolean).slice(0,5),
    note:A(d.note||''), detailedNote:A(d.detailedNote||''),
    fitIndicators:(d.fitIndicators||[]).map(A).filter(Boolean).slice(0,3),
    strengthScores:d.strengthScores||{},
    skills:(d.skills||[]).map(s=>A(s)).filter(Boolean),
    experience:(d.experience||[]).map(e=>({role:A(e.role),company:A(e.company),dates:A(e.dates),description:A(e.description)})),
    education:(d.education||[]).map(e=>({degree:A(e.degree),school:A(e.school),year:A(e.year)})),
    certifications:(d.certifications||[]).map(A).filter(Boolean),
    languages:(d.languages||[]).map(l=>({name:A(l.name),level:A(l.level)})),
    resumeFetched:!!resumeText
  };
  return enriched;
}
async function processAll(cands, opts, onProgress){
  // Phase 1: fetch CVs only if a CV proxy is configured (public proxies are blocked,
  // so without a proxy we skip the wait entirely and go straight to notes).
  let texts;
  if(cvProxy()){ onProgress&&onProgress(0,cands.length,'fetching CVs'); texts=await Promise.all(cands.map(c=>fetchResumeText(c.resume).catch(()=>null))); }
  else { texts=cands.map(()=>null); }
  // Phase 2: AI notes, up to 5 concurrent
  const out=new Array(cands.length); let next=0, done=0;
  const W=Math.min(5,cands.length||1);
  async function worker(){
    while(next<cands.length){ const i=next++; out[i]=await processCandidate(cands[i],opts,texts[i]);
      done++; onProgress&&onProgress(done,cands.length,firstNameOf(cands[i].name)); }
  }
  await Promise.all(Array.from({length:W},()=>worker()));
  return out;
}

/* ---------- rendering ---------- */
function scoreColor(s){return s>=85?'#1f7a5e':s>=70?'#093a3e':s>=55?'#a67714':'#b5502f'}
function cvBlock(c){
  const exp=c.experience.filter(e=>e.role||e.company).map(e=>`
    <div class="cv-exp"><div class="cv-exp-head"><span class="cv-role">${pesc(e.role)}</span><span class="cv-dates">${pesc(e.dates)}</span></div>
    <div class="cv-company">${pesc(e.company)}</div>
    ${e.description?'<ul class="cv-bullets">'+e.description.split('\n').filter(x=>x.trim()).map(x=>'<li>'+pesc(x.replace(/^[-•*]\s*/,''))+'</li>').join('')+'</ul>':''}</div>`).join('');
  const edu=c.education.filter(e=>e.degree||e.school).map(e=>`<div class="cv-edu"><strong>${pesc(e.degree)}</strong> · ${pesc(e.school)} ${e.year?'· '+pesc(e.year):''}</div>`).join('');
  const certs=c.certifications.length?`<div class="cv-sub">Certifications</div><div class="cv-tags">${c.certifications.map(x=>'<span class="ctag">'+pesc(x)+'</span>').join('')}</div>`:'';
  const langs=c.languages.filter(l=>l.name).length?`<div class="cv-sub">Languages</div><div class="cv-line">${c.languages.filter(l=>l.name).map(l=>pesc(l.name)+(l.level?' ('+pesc(l.level)+')':'')).join(' · ')}</div>`:'';
  const skills=c.skills.length?`<div class="cv-sub">Skills</div><div class="cv-tags">${c.skills.map(x=>'<span class="ctag ctag-key">'+pesc(x)+'</span>').join('')}</div>`:'';
  if(!exp&&!edu&&!certs&&!langs&&!skills) return '';
  return `<details class="cv"><summary>📄 View CV</summary><div class="cv-body">
    ${c.summary?'<p class="cv-summary">'+pesc(c.summary)+'</p>':''}
    ${exp?'<div class="cv-sub">Experience</div>'+exp:''}
    ${edu?'<div class="cv-sub">Education</div>'+edu:''}
    ${skills}${certs}${langs}
  </div></details>`;
}
function presCandidateCard(c,i){
  const bars=Object.entries(c.strengthScores).slice(0,6);
  return `<div class="candidate-card fade-in"><div class="card ${i===0?'featured':''}">
    <div class="card-top">
      <div class="card-identity">
        <div class="card-avatar ${i===0?'featured-avatar':''}">${pesc((c.first[0]||'•').toUpperCase())}</div>
        <div>
          <div class="card-name">${pesc(c.first)}</div>
          <div class="card-location">${c.country?'📍 '+pesc(c.country):''}${c.applied?' · '+pesc(c.applied):''}</div>
          <div class="card-badges"><span class="badge badge-shortlisted">Shortlisted</span>${i===0?'<span class="badge badge-shortlisted">Top pick</span>':''}</div>
        </div>
      </div>
      ${c.comp?`<div class="card-rate"><div class="card-rate-amount" style="color:var(--highlight)">${pesc(c.comp)}</div><div class="card-rate-period">Expected · monthly</div></div>`:''}
    </div>
    <div class="card-body">
      ${c.experience.filter(e=>e.role).length?`<div class="card-section-title">Experience Highlights</div><div class="experience-list">${c.experience.filter(e=>e.role).slice(0,4).map((e,j,a)=>`<div class="exp-item"><div class="exp-dot-col"><div class="exp-dot"></div>${j<a.length-1?'<div class="exp-line"></div>':''}</div><div class="exp-content"><div class="exp-role">${pesc(e.role)}</div><div class="exp-company">${pesc(e.company)}${e.dates?' · '+pesc(e.dates):''}</div></div></div>`).join('')}</div>`:''}
      ${c.skills.length?`<div class="card-section-title">Platforms &amp; Tools</div><div class="tags-cluster">${c.skills.slice(0,5).map(s=>'<span class="ctag ctag-key">'+pesc(s)+'</span>').join('')}${c.skills.slice(5).map(s=>'<span class="ctag">'+pesc(s)+'</span>').join('')}</div>`:''}
      ${c.fitIndicators.length?`<div class="card-section-title">Fit Indicators</div><div class="fit-grid">${c.fitIndicators.map(s=>'<div class="fit-item"><div class="fit-label">'+pesc(s)+'</div></div>').join('')}</div>`:''}
      ${bars.length?`<div class="card-section-title">Strength Profile</div><div class="strength-bars">${bars.map(([k,v])=>`<div class="bar-item"><div class="bar-label">${pesc(k)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,Math.min(100,v))}%"></div></div></div>`).join('')}</div>`:''}
      <div class="card-actions">${c.video?`<a class="video-intro-btn" href="${pesc(c.video)}" target="_blank">🎬 Watch Intro Video</a>`:''}</div>
      ${cvBlock(c)}
    </div>
    ${c.detailedNote?`<div class="card-footer"><div class="card-recruiter-note"><div class="recruiter-note-title">Why we're presenting ${pesc(c.first)}</div><p>${pesc(c.detailedNote)}</p></div></div>`:''}
  </div></div>`;
}

function buildPresentationHTML(batches, o){
  const advisor=o.advisor||{};
  batches=(batches||[]).slice().sort((a,b)=>a.batch-b.batch);
  const active=batches.length?batches[batches.length-1].batch:1;
  const total=batches.reduce((s,b)=>s+(b.cands?b.cands.length:0),0);
  const dateF=fmtDate((batches[batches.length-1]||{}).date||new Date().toISOString().slice(0,10));
  const dataJSON=JSON.stringify({member:o.member,role:o.role,advisor,batches}).replace(/</g,'\\u003c');
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${pesc(o.role)} Candidates — ${pesc(o.member)}</title>
<link rel="icon" href="${SAGAN_LOGO}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--primary:#a67714;--primary-dark:#8a6011;--primary-deeper:#051f22;--dark:#093a3e;--highlight:#e8b32f;
--bg-page:#f3f2ec;--bg-light:#ebe9df;--bg-card:#fbfaf3;--bg-card-hover:#ffffff;--bg-subtle:rgba(10,14,15,.045);
--text-primary:#0a0e0f;--text-mid:#3a4543;--text-light:#6b7264;--on-dark-mid:rgba(255,255,255,.82);
--border:rgba(10,14,15,.14);--border-strong:rgba(10,14,15,.25);--tag-bg:#a677141a;--tag-color:#8a6011;
--radius:14px;--shadow-md:0 1px 3px rgba(10,14,15,.05),0 10px 30px rgba(10,14,15,.07);
--font-heading:'Fraunces',serif;--font-body:'Inter',sans-serif;--font-meta:'JetBrains Mono',monospace;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:var(--font-body);font-size:16px;color:var(--text-primary);background:var(--bg-page);line-height:1.6;-webkit-font-smoothing:antialiased}
.fade-in{opacity:0;transform:translateY(24px);transition:opacity .7s,transform .7s}.fade-in.visible{opacity:1;transform:none}
.hero-top-bar{background:linear-gradient(90deg,var(--primary),var(--highlight));height:4px}
.hero{background:linear-gradient(160deg,#051f22 0%,#093a3e 72%,#0c5258 100%);color:#fff;padding:72px 60px 64px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-40%;right:-15%;width:700px;height:700px;background:radial-gradient(circle,#e8b32f12,transparent 70%);border-radius:50%}
.hero-inner{max-width:1100px;margin:0 auto;position:relative;z-index:2}
.hero-brand{display:flex;align-items:center;gap:16px;margin-bottom:48px}.hero-brand .logo-img{height:30px;filter:brightness(0) invert(1)}
.hero-brand .logo-sep{width:1px;height:24px;background:rgba(255,255,255,.25)}.hero-brand .logo-sub{font-family:var(--font-meta);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5)}
.hero-eyebrow{display:inline-block;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:100px;padding:6px 18px;font-family:var(--font-meta);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:24px;color:var(--highlight)}
.hero h1{font-family:var(--font-heading);font-size:46px;font-weight:500;line-height:1.15;max-width:720px;margin-bottom:16px;letter-spacing:-.02em}.hero h1 strong{font-weight:700}
.hero-sub{font-size:17px;color:rgba(255,255,255,.6);max-width:660px;line-height:1.7;margin-bottom:44px}
.hero-meta{display:flex;gap:40px;flex-wrap:wrap}.hero-meta-item{display:flex;flex-direction:column;gap:4px}
.hero-meta-label{font-family:var(--font-meta);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#a67714e6}.hero-meta-value{font-size:14px;font-weight:500;color:rgba(255,255,255,.78)}
.editorial{max-width:780px;margin:0 auto;padding:72px 40px 0}.editorial-label{font-family:var(--font-meta);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--primary);margin-bottom:20px}
.editorial-text{font-size:17px;line-height:1.85;color:var(--text-mid)}.editorial-text p{margin-bottom:16px}.editorial-divider{width:48px;height:3px;background:var(--primary);border-radius:2px;margin-top:32px}
.candidates-section{background:var(--bg-light);padding:72px 0;margin-top:72px}
.candidates-header{text-align:center;padding:0 24px 40px}.candidates-header h2{font-family:var(--font-heading);font-size:32px;font-weight:700;margin-bottom:8px}.candidates-header p{font-family:var(--font-meta);font-size:14px;color:var(--text-light)}
.batch-switcher{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:0 auto 36px;padding:0 24px}
.batch-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border:1.5px solid var(--border-strong);border-radius:10px;background:var(--bg-card);font-family:var(--font-meta);font-size:12px;font-weight:600;color:var(--text-light);cursor:pointer;transition:.18s}
.batch-btn:hover{border-color:var(--primary);color:var(--text-primary)}
.batch-btn.active{background:var(--dark);border-color:var(--dark);color:#fff}
.batch-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:20px;background:var(--primary);color:#fff;font-size:11px;font-weight:700}
.batch-btn.active .batch-count{background:var(--highlight);color:var(--dark)}
.batch-panel.hidden{display:none}
.candidate-card{max-width:1100px;margin:0 auto 32px;padding:0 40px}
.card{background:var(--bg-card);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-md);transition:transform .3s,box-shadow .3s}
.card:hover{transform:translateY(-2px);box-shadow:0 1px 3px rgba(0,0,0,.04),0 16px 48px rgba(0,0,0,.1)}.card.featured{box-shadow:var(--shadow-md),0 0 0 1px #a6771433}
.card-top{background:var(--dark);padding:32px 44px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.card-identity{display:flex;align-items:center;gap:20px}
.card-avatar{width:56px;height:56px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0;font-family:var(--font-heading)}.card-avatar.featured-avatar{background:var(--highlight);color:var(--dark)}
.card-name{font-family:var(--font-heading);font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}.card-location{font-size:14px;color:var(--on-dark-mid)}
.card-badges{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.badge{font-family:var(--font-meta);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:100px}.badge-shortlisted{background:#a6771433;color:var(--primary);border:1px solid #a6771466}
.card-rate{text-align:right}.card-rate-amount{font-size:26px;font-weight:700;font-family:var(--font-heading)}.card-rate-period{font-family:var(--font-meta);font-size:10px;color:var(--on-dark-mid);text-transform:uppercase;letter-spacing:1px}
.card-body{padding:36px 44px;color:var(--text-mid)}
.card-section-title{font-family:var(--font-meta);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--primary);margin:28px 0 14px}
.card-narrative{font-size:16px;line-height:1.8;color:var(--text-mid);font-style:italic;border-left:3px solid var(--primary);padding-left:20px}.card-narrative strong{color:var(--text-primary);font-weight:600;font-style:normal}
.strength-list{padding-left:18px}.strength-list li{font-size:14px;color:var(--text-mid);margin-bottom:8px;line-height:1.6}
.experience-list{display:flex;flex-direction:column;gap:18px}.exp-item{display:flex;gap:16px}.exp-dot-col{display:flex;flex-direction:column;align-items:center;padding-top:6px}
.exp-dot{width:9px;height:9px;border-radius:50%;background:var(--primary);flex-shrink:0}.exp-line{width:1px;flex:1;background:#a6771433;margin-top:6px;min-height:24px}
.exp-role{font-size:15px;font-weight:600;color:var(--text-primary)}.exp-company{font-size:13px;color:var(--text-light);margin-top:2px}
.tags-cluster{display:flex;flex-wrap:wrap;gap:8px}.ctag{font-family:var(--font-meta);font-size:11px;padding:6px 14px;border-radius:6px;background:var(--bg-subtle);color:var(--text-mid)}.ctag-key{background:#a677141a;color:var(--primary);font-weight:600}
.fit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.fit-item{background:var(--bg-subtle);padding:14px 16px;border-radius:8px;border:1px solid var(--border-strong)}.fit-label{font-size:12px;color:var(--text-mid);line-height:1.5}
.strength-bars{display:grid;grid-template-columns:1fr 1fr;gap:14px 24px}.bar-item{display:flex;flex-direction:column;gap:6px}.bar-label{font-family:var(--font-meta);font-size:12px;color:var(--text-mid)}
.bar-track{height:5px;background:var(--bg-subtle);border-radius:3px;overflow:hidden}.bar-fill{height:100%;background:linear-gradient(90deg,var(--primary-dark),var(--primary));border-radius:3px}
.card-actions{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}
.video-intro-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;background:var(--primary);border:1.5px solid var(--primary);border-radius:8px;color:#fff;font-family:var(--font-meta);font-size:13px;font-weight:600;text-decoration:none;transition:.2s}.video-intro-btn:hover{background:var(--primary-dark)}
.cv{margin-top:22px;border:1px solid var(--border);border-radius:10px;background:var(--bg-subtle);overflow:hidden}
.cv summary{cursor:pointer;padding:14px 18px;font-family:var(--font-meta);font-size:13px;font-weight:600;color:var(--primary);list-style:none}.cv summary::-webkit-details-marker{display:none}
.cv-body{padding:6px 22px 22px}.cv-summary{font-size:14px;color:var(--text-mid);line-height:1.7;margin-bottom:8px}
.cv-sub{font-family:var(--font-meta);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--primary);margin:18px 0 8px}
.cv-exp{margin-bottom:14px}.cv-exp-head{display:flex;justify-content:space-between;gap:10px}.cv-role{font-weight:600;color:var(--text-primary);font-size:14px}.cv-dates{font-size:12px;color:var(--text-light);white-space:nowrap}
.cv-company{font-size:13px;color:var(--text-light)}.cv-bullets{margin:6px 0 0 18px}.cv-bullets li{font-size:13px;color:var(--text-mid);margin-bottom:4px;line-height:1.5}
.cv-edu{font-size:13px;color:var(--text-mid);margin-bottom:6px}.cv-tags{display:flex;flex-wrap:wrap;gap:6px}.cv-line{font-size:13px;color:var(--text-mid)}
.cv-note{margin-top:16px;font-size:11px;color:var(--text-light);font-style:italic}
.card-footer{padding:0 44px 28px}.card-recruiter-note{padding:18px 22px;background:linear-gradient(135deg,#e8b32f1a,#e8b32f08);border-left:3px solid var(--highlight);border-radius:0 10px 10px 0}
.card-recruiter-note .recruiter-note-title{font-family:var(--font-meta);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#b5651d;margin-bottom:6px}.card-recruiter-note p{font-size:14px;color:var(--text-mid);line-height:1.7}
.advisor-section{max-width:780px;margin:0 auto;padding:72px 40px 40px}.advisor-section-label{font-family:var(--font-meta);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--primary);margin-bottom:20px;text-align:center}
.advisor-card{display:flex;gap:28px;background:var(--bg-card);border-radius:16px;padding:36px;box-shadow:var(--shadow-md);border:1px solid var(--border)}
.advisor-avatar{width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);flex-shrink:0;background:var(--bg-subtle)}
.advisor-name{font-family:var(--font-heading);font-size:22px;font-weight:700}.advisor-role{font-family:var(--font-meta);font-size:13px;color:var(--text-light);margin-bottom:12px}.advisor-summary{font-size:14px;color:var(--text-mid);line-height:1.75}
.advisor-contact{margin-top:12px;font-size:13px}.advisor-contact a{color:var(--primary);text-decoration:none;font-weight:600}
.sagan-info{max-width:780px;margin:0 auto;padding:0 40px 56px}.sagan-info-inner{display:flex;gap:32px;justify-content:center;padding:32px 0;border-top:1px solid var(--border);flex-wrap:wrap}
.sagan-stat{text-align:center}.sagan-stat-number{font-family:var(--font-heading);font-size:28px;font-weight:700;color:var(--primary)}.sagan-stat-label{font-family:var(--font-meta);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-top:4px}
.footer-cta{background:var(--dark);padding:72px 40px;text-align:center}.footer-cta h2{font-family:var(--font-heading);font-size:32px;font-weight:400;color:#fff;margin-bottom:12px}.footer-cta h2 strong{font-weight:700}
.footer-cta p{font-size:16px;color:rgba(255,255,255,.55);margin:0 auto 32px;max-width:480px}.footer-contact{display:inline-block;padding:14px 36px;background:var(--primary);color:#fff;border-radius:8px;font-family:var(--font-meta);font-size:14px;font-weight:600;text-decoration:none}
.site-footer{text-align:center;padding:32px;color:rgba(255,255,255,.45);font-family:var(--font-meta);font-size:12px;background:var(--dark);border-top:1px solid rgba(255,255,255,.08)}.site-footer img{height:20px;opacity:.6;filter:brightness(0) invert(1)}
@media(max-width:768px){.hero{padding:48px 24px}.hero h1{font-size:30px}.card-top{flex-direction:column;padding:24px}.card-body{padding:24px}.candidate-card{padding:0 16px}.fit-grid,.strength-bars{grid-template-columns:1fr}.advisor-card{flex-direction:column;text-align:center}.sagan-info-inner{flex-direction:column}}
</style></head><body>
<div class="hero-top-bar"></div>
<section class="hero"><div class="hero-inner">
  <div class="hero-brand"><img class="logo-img" src="${SAGAN_LOGO}" alt="Sagan"/><div class="logo-sep"></div><span class="logo-sub">Talent Selection</span></div>
  <div class="hero-eyebrow">Sagan Talent Search</div>
  <h1><strong>${pesc(o.role)}</strong> Candidates for ${pesc(o.member)}</h1>
  <p class="hero-sub">Curated talent matched to your specific needs for this role.</p>
  <div class="hero-meta">
    <div class="hero-meta-item"><span class="hero-meta-label">Candidates</span><span class="hero-meta-value">${total} profiles</span></div>
    <div class="hero-meta-item"><span class="hero-meta-label">${batches.length>1?'Batches':'Batch'}</span><span class="hero-meta-value">${batches.length>1?batches.length+' · latest '+dateF:'Batch '+active+' · '+dateF}</span></div>
    <div class="hero-meta-item"><span class="hero-meta-label">Advisor</span><span class="hero-meta-value">${pesc(advisor.name||'Sagan')}</span></div>
  </div>
</div></section>
<section class="candidates-section">
  <div class="candidates-header fade-in"><h2>Candidate Profiles</h2></div>
  ${batches.length>1?`<div class="batch-switcher fade-in">${batches.map(b=>`<button class="batch-btn${b.batch===active?' active':''}" data-b="${b.batch}" onclick="showBatch(${b.batch})">Batch ${b.batch}<span class="batch-count">${b.cands.length}</span></button>`).join('')}</div>`:''}
  ${batches.map(b=>`<div class="batch-panel${b.batch===active?'':' hidden'}" id="batch-${b.batch}">${(b.cands||[]).map((c,i)=>presCandidateCard(c,i)).join('')}</div>`).join('')}
</section>
<script type="application/json" id="sm-batches">${dataJSON}</script>
<div class="advisor-section fade-in"><div class="advisor-section-label">Your Talent Advisor</div>
  <div class="advisor-card">
    ${advisor.photo?`<img class="advisor-avatar" src="${pesc(advisor.photo)}" alt="${pesc(advisor.name)}"/>`:`<div class="advisor-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:700;font-size:26px;color:var(--primary)">${pesc(initials(advisor.name))}</div>`}
    <div class="advisor-info"><div class="advisor-name">${pesc(advisor.name||'Your Sagan Advisor')}</div>
      <div class="advisor-role">${pesc(advisor.title||advisor.role||'Talent Advisor, Sagan')}</div>
      <p class="advisor-summary">${pesc(advisor.summary||'Your dedicated point of contact at Sagan. Reach out any time to move forward with interviews.')}</p>
      <div class="advisor-contact">${advisor.email?`✉ <a href="mailto:${pesc(advisor.email)}">${pesc(advisor.email)}</a>`:''}${advisor.booking?` · 📅 <a href="${pesc(advisor.booking)}" target="_blank">Book a call</a>`:''}</div>
    </div>
  </div>
</div>
<div class="sagan-info"><div class="sagan-info-inner">
  <div class="sagan-stat"><div class="sagan-stat-number">20,000+</div><div class="sagan-stat-label">Applications / month</div></div>
  <div class="sagan-stat"><div class="sagan-stat-number">2,000+</div><div class="sagan-stat-label">Placements</div></div>
  <div class="sagan-stat"><div class="sagan-stat-number">30+</div><div class="sagan-stat-label">Countries</div></div>
</div></div>
<section class="footer-cta"><h2>Ready to <strong>move forward</strong>?</h2><p>Tell us which candidates you'd like to interview and we'll coordinate next steps.</p>
  ${advisor.email?`<a class="footer-contact" href="mailto:${pesc(advisor.email)}?subject=${encodeURIComponent('Re: '+o.role+' candidates')}">Contact ${pesc((advisor.name||'Sagan').split(' ')[0])}</a>`:''}</section>
<footer class="site-footer"><div><img src="${SAGAN_LOGO}" alt="Sagan"/></div><div style="margin-top:10px">Redefining Recruitment · <a href="https://getsagan.com" style="color:var(--primary)">getsagan.com</a></div></footer>
<script>
function showBatch(n){document.querySelectorAll('.batch-panel').forEach(p=>p.classList.toggle('hidden',p.id!=='batch-'+n));document.querySelectorAll('.batch-btn').forEach(b=>b.classList.toggle('active',b.dataset.b===String(n)));const s=document.querySelector('.candidates-section');if(s)window.scrollTo({top:s.offsetTop-16,behavior:'smooth'});}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.1});document.querySelectorAll('.fade-in').forEach(el=>io.observe(el));
</script>
</body></html>`;
}

/* ---------- GitHub publish (explicit, confirmed) ---------- */
// Publish/merge: one page per member+role. A new batch becomes a new TAB on the
// existing page (prior batches preserved), instead of a separate page.
async function ghPublishBatch(o, batch, onStatus){
  const token=getKey('github'); if(!token) throw new Error('Missing GitHub PAT (Settings)');
  const repo=slugify(o.member+'-'+o.role)+'-candidates';
  const headers={'Authorization':'token '+token,'Accept':'application/vnd.github+json'};
  onStatus&&onStatus('Checking '+repo+'…');
  let sha=null, prior=[];
  try{
    const g=await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}/contents/index.html`,{headers});
    if(g.ok){ const j=await g.json(); sha=j.sha;
      const html=decodeURIComponent(escape(atob((j.content||'').replace(/\n/g,''))));
      const m=html.match(/<script type="application\/json" id="sm-batches">([\s\S]*?)<\/script>/);
      if(m){ try{ prior=(JSON.parse(m[1].replace(/\\u003c/g,'<')).batches)||[]; }catch(e){} }
    }
  }catch(e){}
  if(!sha){ onStatus&&onStatus('Creating page '+repo+'…');
    const cr=await fetch(`https://api.github.com/user/repos`,{method:'POST',headers,body:JSON.stringify({name:repo,private:false,description:`${o.role} candidates for ${o.member} — Sagan`})});
    if(!cr.ok && cr.status!==422) throw new Error('Create repo: '+(await cr.text()).slice(0,160)); }
  const merged=prior.filter(b=>b.batch!==batch.batch).concat([batch]).sort((a,b)=>a.batch-b.batch);
  const html=buildPresentationHTML(merged, o);
  onStatus&&onStatus(`Publishing (${merged.length} batch${merged.length>1?'es':''} as tabs)…`);
  const content=btoa(unescape(encodeURIComponent(html)));
  const put=await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}/contents/index.html`,{method:'PUT',headers,body:JSON.stringify({message:'Publish batch '+batch.batch,content,...(sha?{sha}:{})})});
  if(!put.ok) throw new Error('Upload: '+(await put.text()).slice(0,160));
  onStatus&&onStatus('Enabling GitHub Pages…');
  try{await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}/pages`,{method:'POST',headers,body:JSON.stringify({source:{branch:'main',path:'/'}})});}catch(e){}
  return { url:`https://${GH_ORG}.github.io/${repo}/`, batches:merged.length, existed:!!sha };
}
