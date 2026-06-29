/* ============================================================
   Sagan Presentation Page generator + GitHub publish.
   Reuses the rt-builder page structure, Sagan-branded, fed from
   the Sourcing Matcher's selected candidates. READ-ONLY on data:
   the only write is an EXPLICIT, confirmed publish to GitHub Pages.
   ============================================================ */
const SAGAN_LOGO='https://saganrecruitment.com/wp-content/uploads/2025/10/Sagan-Logo-2-e1759568299542.png';
const GH_ORG='wg-dotcom';
function pesc(s){return (s==null?'':''+s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function initials(n){return (n||'').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'•'}
function fmtDate(d){try{return new Date(d+(d.length<=10?'T12:00:00':'')).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}catch(e){return d||''}}
function slugify(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}

function presCandidateCard(c,i){
  const date=c.created?new Date(c.created).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
  const reasons=(c.reasons||[]).map(r=>`<li>${pesc(r)}</li>`).join('');
  const featured=i===0?'featured':'';
  return `<div class="candidate-card fade-in">
    <div class="card ${featured}">
      <div class="card-top">
        <div class="card-identity">
          <div class="card-avatar ${i===0?'featured-avatar':''}">${pesc(initials(c.name))}</div>
          <div>
            <div class="card-name">${pesc(c.name)}</div>
            <div class="card-location">${c.country?'📍 '+pesc(c.country):''}${c.role?' &nbsp;·&nbsp; '+pesc(c.role):''}</div>
            <div class="card-badges">
              <span class="badge badge-shortlisted">Shortlisted</span>
              <span class="badge badge-shortlisted">Last applied ${pesc(date)}</span>
            </div>
          </div>
        </div>
        <div class="card-rate">
          <div class="card-rate-amount">${c.score}<span style="font-size:14px">%</span></div>
          <div class="card-rate-period">Role Match</div>
        </div>
      </div>
      <div class="card-body">
        ${c.verdict?`<div class="card-narrative"><strong>${pesc(c.verdict)}</strong></div>`:''}
        <div class="card-section">
          <div class="card-section-title">Why this candidate</div>
          <ul class="strength-list">${reasons}</ul>
        </div>
        <div class="card-section">
          <div class="card-section-title">Profile summary</div>
          <p style="font-size:14px;line-height:1.75;color:var(--text-mid)">${pesc(c.text||'')}</p>
        </div>
        ${c.concern?`<div class="card-recruiter-note"><div class="recruiter-note-title">Honest note</div><p>${pesc(c.concern)}</p></div>`:''}
        <div class="card-actions">
          ${c.video?`<a class="video-intro-btn" href="${pesc(c.video)}" target="_blank">🎬 Watch Intro Video</a>`:''}
          ${c.resume?`<a class="btn-card btn-outline" href="${pesc(c.resume)}" target="_blank">📄 Resume</a>`:''}
          ${c.linkedin?`<a class="btn-card btn-outline" href="${pesc(c.linkedin)}" target="_blank">in LinkedIn</a>`:''}
        </div>
      </div>
    </div>
  </div>`;
}

function presComparison(cands){
  const rows=cands.map(c=>`<tr>
    <td style="font-weight:600;color:var(--text-primary)">${pesc(c.name)}</td>
    <td>${pesc(c.country||'—')}</td>
    <td class="highlight-cell">${c.score}%</td>
    <td>${pesc(c.verdict||'')}</td></tr>`).join('');
  return `<div class="comparison-section fade-in">
    <div class="comparison-table-wrap"><table class="comparison-table">
      <thead><tr><th>Candidate</th><th>Location</th><th>Match</th><th>Headline</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}

function buildPresentationHTML(cands, o){
  const advisor=o.advisor||{};
  const batch=o.batchNumber||1;
  const dateF=fmtDate(o.batchDate||new Date().toISOString().slice(0,10));
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${pesc(o.role)} Candidates — ${pesc(o.member)}</title>
<link rel="icon" href="${SAGAN_LOGO}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{
  --primary:#2197ff;--primary-dark:#1a7fd9;--primary-deeper:#0a4f8f;
  --dark:#093a3e;--highlight:#f5b800;--white:#fff;
  --bg-page:#fff;--bg-light:#f5f2ed;--bg-card:#fff;--bg-card-hover:#fafafa;--bg-subtle:rgba(9,58,62,.04);
  --text-primary:#093a3e;--text-mid:#46544f;--text-light:#6b7264;--text-muted:#9aa39c;
  --on-dark-mid:rgba(255,255,255,.82);--border:rgba(9,58,62,.1);--border-strong:rgba(9,58,62,.14);
  --tag-bg:#2197ff1a;--tag-color:#1a7fd9;--radius:16px;--shadow-md:0 1px 3px rgba(0,0,0,.04),0 8px 28px rgba(0,0,0,.06);
  --font-heading:'Space Grotesk',sans-serif;--font-body:'Inter',sans-serif;--font-meta:'Poppins',sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{font-family:var(--font-body);font-size:16px;color:var(--text-primary);background:var(--bg-page);line-height:1.6;-webkit-font-smoothing:antialiased}
.fade-in{opacity:0;transform:translateY(24px);transition:opacity .7s,transform .7s}.fade-in.visible{opacity:1;transform:none}
.hero-top-bar{background:linear-gradient(90deg,var(--primary),var(--highlight));height:4px}
.hero{background:linear-gradient(155deg,var(--dark) 0%,var(--primary-deeper) 60%,var(--primary-dark) 100%);color:#fff;padding:72px 60px 64px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-40%;right:-15%;width:700px;height:700px;background:radial-gradient(circle,#f5b80012,transparent 70%);border-radius:50%}
.hero-inner{max-width:1100px;margin:0 auto;position:relative;z-index:2}
.hero-brand{display:flex;align-items:center;gap:16px;margin-bottom:48px}
.hero-brand .logo-img{height:30px;filter:brightness(0) invert(1)}
.hero-brand .logo-sep{width:1px;height:24px;background:rgba(255,255,255,.25)}
.hero-brand .logo-sub{font-family:var(--font-meta);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5)}
.hero-eyebrow{display:inline-block;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:100px;padding:6px 18px;font-family:var(--font-meta);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:24px;color:var(--highlight)}
.hero h1{font-family:var(--font-heading);font-size:48px;font-weight:400;line-height:1.15;max-width:720px;margin-bottom:16px;letter-spacing:-.02em}
.hero h1 strong{font-weight:700}
.hero-sub{font-size:17px;color:rgba(255,255,255,.6);max-width:660px;line-height:1.7;margin-bottom:44px}
.hero-meta{display:flex;gap:40px;flex-wrap:wrap}
.hero-meta-item{display:flex;flex-direction:column;gap:4px}
.hero-meta-label{font-family:var(--font-meta);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#2197ffe6}
.hero-meta-value{font-size:14px;font-weight:500;color:rgba(255,255,255,.78)}
.editorial{max-width:780px;margin:0 auto;padding:72px 40px 0}
.editorial-label{font-family:var(--font-meta);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--primary);margin-bottom:20px}
.editorial-text{font-size:17px;line-height:1.85;color:var(--text-mid)}.editorial-text p{margin-bottom:16px}
.editorial-divider{width:48px;height:3px;background:var(--primary);border-radius:2px;margin-top:32px}
.candidates-section{background:var(--bg-light);padding:72px 0;margin-top:72px}
.candidates-header{text-align:center;padding:0 24px 40px}
.candidates-header h2{font-family:var(--font-heading);font-size:32px;font-weight:700;margin-bottom:8px}
.candidates-header p{font-family:var(--font-meta);font-size:14px;color:var(--text-light)}
.candidate-card{max-width:1100px;margin:0 auto 32px;padding:0 40px}
.card{background:var(--bg-card);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-md);transition:transform .3s,box-shadow .3s}
.card:hover{transform:translateY(-2px);box-shadow:0 1px 3px rgba(0,0,0,.04),0 16px 48px rgba(0,0,0,.1)}
.card.featured{box-shadow:var(--shadow-md),0 0 0 1px #2197ff33}
.card-top{background:var(--dark);padding:32px 44px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.card-identity{display:flex;align-items:center;gap:20px}
.card-avatar{width:56px;height:56px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;font-family:var(--font-heading)}
.card-avatar.featured-avatar{background:var(--highlight);color:var(--dark)}
.card-name{font-family:var(--font-heading);font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
.card-location{font-size:14px;color:var(--on-dark-mid)}
.card-badges{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.badge{font-family:var(--font-meta);font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:100px}
.badge-shortlisted{background:#2197ff33;color:var(--primary);border:1px solid #2197ff66}
.card-rate{text-align:right}.card-rate-amount{font-size:26px;font-weight:700;color:var(--primary);font-family:var(--font-heading)}
.card-rate-period{font-family:var(--font-meta);font-size:10px;color:var(--on-dark-mid);text-transform:uppercase;letter-spacing:1px}
.card-body{padding:36px 44px;color:var(--text-mid)}
.card-section-title{font-family:var(--font-meta);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--primary);margin:28px 0 14px}
.card-narrative{font-size:16px;line-height:1.8;color:var(--text-mid);font-style:italic;border-left:3px solid var(--primary);padding-left:20px}
.card-narrative strong{color:var(--text-primary);font-weight:600;font-style:normal}
.strength-list{padding-left:18px}.strength-list li{font-size:14px;color:var(--text-mid);margin-bottom:8px;line-height:1.6}
.card-recruiter-note{margin-top:24px;padding:18px 22px;background:linear-gradient(135deg,#f5b8001a,#f5b80008);border-left:3px solid var(--highlight);border-radius:0 10px 10px 0}
.card-recruiter-note .recruiter-note-title{font-family:var(--font-meta);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#b5651d;margin-bottom:6px}
.card-recruiter-note p{font-size:14px;color:var(--text-mid);line-height:1.7}
.card-actions{margin-top:28px;padding-top:24px;border-top:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.video-intro-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;background:var(--primary);border:1.5px solid var(--primary);border-radius:8px;color:#fff;font-family:var(--font-meta);font-size:13px;font-weight:600;text-decoration:none;transition:.2s}
.video-intro-btn:hover{background:var(--primary-dark)}
.btn-card{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-family:var(--font-meta);font-size:13px;font-weight:600;text-decoration:none;transition:.15s}
.btn-outline{background:var(--bg-card);color:var(--primary);border:1.5px solid var(--primary)}.btn-outline:hover{background:var(--tag-bg)}
.comparison-section{max-width:1100px;margin:8px auto 0;padding:0 40px}
.comparison-table-wrap{overflow-x:auto;border-radius:var(--radius);box-shadow:var(--shadow-md)}
.comparison-table{width:100%;border-collapse:collapse;background:var(--bg-card);font-size:13px;color:var(--text-mid);border-radius:12px;overflow:hidden}
.comparison-table thead th{background:var(--dark);color:var(--primary);padding:14px 16px;text-align:left;font-family:var(--font-meta);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.comparison-table tbody td{padding:12px 16px;border-bottom:1px solid var(--border)}
.comparison-table tbody tr:last-child td{border-bottom:none}.comparison-table tbody tr:hover{background:var(--bg-card-hover)}
.comparison-table .highlight-cell{background:#2197ff1a;font-weight:600;color:var(--primary)}
.advisor-section{max-width:780px;margin:0 auto;padding:72px 40px 40px}
.advisor-section-label{font-family:var(--font-meta);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--primary);margin-bottom:20px;text-align:center}
.advisor-card{display:flex;gap:28px;background:var(--bg-card);border-radius:16px;padding:36px;box-shadow:var(--shadow-md);border:1px solid var(--border)}
.advisor-avatar{width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--primary);flex-shrink:0;background:var(--bg-subtle)}
.advisor-name{font-family:var(--font-heading);font-size:22px;font-weight:700}
.advisor-role{font-family:var(--font-meta);font-size:13px;color:var(--text-light);margin-bottom:12px}
.advisor-summary{font-size:14px;color:var(--text-mid);line-height:1.75}
.advisor-contact{margin-top:12px;font-size:13px}.advisor-contact a{color:var(--primary);text-decoration:none;font-weight:600}
.sagan-info{max-width:780px;margin:0 auto;padding:0 40px 56px}
.sagan-info-inner{display:flex;gap:32px;justify-content:center;padding:32px 0;border-top:1px solid var(--border);flex-wrap:wrap}
.sagan-stat{text-align:center}.sagan-stat-number{font-family:var(--font-heading);font-size:28px;font-weight:700;color:var(--primary)}
.sagan-stat-label{font-family:var(--font-meta);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-light);margin-top:4px}
.footer-cta{background:var(--dark);padding:72px 40px;text-align:center}
.footer-cta h2{font-family:var(--font-heading);font-size:32px;font-weight:400;color:#fff;margin-bottom:12px}.footer-cta h2 strong{font-weight:700}
.footer-cta p{font-size:16px;color:rgba(255,255,255,.55);margin-bottom:32px;max-width:480px;margin:0 auto 32px}
.footer-contact{display:inline-block;padding:14px 36px;background:var(--primary);color:#fff;border-radius:8px;font-family:var(--font-meta);font-size:14px;font-weight:600;text-decoration:none;transition:.2s}
.footer-contact:hover{background:var(--primary-dark)}
.site-footer{text-align:center;padding:32px;color:rgba(255,255,255,.45);font-family:var(--font-meta);font-size:12px;background:var(--dark);border-top:1px solid rgba(255,255,255,.08)}
.site-footer img{height:20px;opacity:.6;filter:brightness(0) invert(1)}
@media(max-width:768px){.hero{padding:48px 24px}.hero h1{font-size:30px}.card-top{flex-direction:column;padding:24px}.card-body{padding:24px}.candidate-card{padding:0 16px}.advisor-card{flex-direction:column;text-align:center}.sagan-info-inner{flex-direction:column}}
</style></head><body>
<div class="hero-top-bar"></div>
<section class="hero"><div class="hero-inner">
  <div class="hero-brand">
    <img class="logo-img" src="${SAGAN_LOGO}" alt="Sagan"/>
    <div class="logo-sep"></div><span class="logo-sub">Talent Selection</span>
  </div>
  <div class="hero-eyebrow">Sagan Talent Search</div>
  <h1><strong>${pesc(o.role)}</strong> Candidates for ${pesc(o.member)}</h1>
  <p class="hero-sub">Curated talent, vetted and matched to your specific needs. Each profile below was evaluated for role alignment, skills, and fit.</p>
  <div class="hero-meta">
    <div class="hero-meta-item"><span class="hero-meta-label">Candidates</span><span class="hero-meta-value">${cands.length} profiles</span></div>
    <div class="hero-meta-item"><span class="hero-meta-label">Batch</span><span class="hero-meta-value">${batch} &middot; ${dateF}</span></div>
    <div class="hero-meta-item"><span class="hero-meta-label">Advisor</span><span class="hero-meta-value">${pesc(advisor.name||'Sagan')}</span></div>
  </div>
</div></section>
${o.introNote&&o.introNote.trim()?`<section class="editorial fade-in"><div class="editorial-label">Our Selection Rationale</div><div class="editorial-text"><p>${pesc(o.introNote).replace(/\n+/g,'</p><p>')}</p></div><div class="editorial-divider"></div></section>`:''}
<section class="candidates-section">
  <div class="candidates-header fade-in"><h2>Candidate Profiles · Batch ${batch}</h2><p>Each candidate was carefully selected and evaluated for this role.</p></div>
  ${cands.map((c,i)=>presCandidateCard(c,i)).join('')}
  ${cands.length>1?presComparison(cands):''}
</section>
<div class="advisor-section fade-in">
  <div class="advisor-section-label">Your Talent Advisor</div>
  <div class="advisor-card">
    ${advisor.photo?`<img class="advisor-avatar" src="${pesc(advisor.photo)}" alt="${pesc(advisor.name)}"/>`:`<div class="advisor-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-weight:700;font-size:26px;color:var(--primary)">${pesc(initials(advisor.name))}</div>`}
    <div class="advisor-info">
      <div class="advisor-name">${pesc(advisor.name||'Your Sagan Advisor')}</div>
      <div class="advisor-role">${pesc(advisor.title||advisor.role||'Talent Advisor, Sagan')}</div>
      <p class="advisor-summary">${pesc(advisor.summary||'Your dedicated point of contact at Sagan. Reach out any time to move forward with interviews or ask questions about these candidates.')}</p>
      <div class="advisor-contact">${advisor.email?`✉ <a href="mailto:${pesc(advisor.email)}">${pesc(advisor.email)}</a>`:''}${advisor.booking?` &nbsp;·&nbsp; 📅 <a href="${pesc(advisor.booking)}" target="_blank">Book a call</a>`:''}</div>
    </div>
  </div>
</div>
<div class="sagan-info"><div class="sagan-info-inner">
  <div class="sagan-stat"><div class="sagan-stat-number">20,000+</div><div class="sagan-stat-label">Applications / month</div></div>
  <div class="sagan-stat"><div class="sagan-stat-number">2,000+</div><div class="sagan-stat-label">Placements</div></div>
  <div class="sagan-stat"><div class="sagan-stat-number">30+</div><div class="sagan-stat-label">Countries</div></div>
</div></div>
<section class="footer-cta">
  <h2>Ready to <strong>move forward</strong>?</h2>
  <p>Let us know which candidates you'd like to interview and we'll coordinate the next steps.</p>
  ${advisor.email?`<a class="footer-contact" href="mailto:${pesc(advisor.email)}?subject=${encodeURIComponent('Re: '+o.role+' candidates')}">Contact ${pesc((advisor.name||'Sagan').split(' ')[0])}</a>`:''}
</section>
<footer class="site-footer"><div><img src="${SAGAN_LOGO}" alt="Sagan"/></div><div style="margin-top:10px">Redefining Recruitment &nbsp;·&nbsp; <a href="https://getsagan.com" style="color:var(--primary)">getsagan.com</a></div></footer>
<script>
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.1});
document.querySelectorAll('.fade-in').forEach(el=>io.observe(el));
</script>
</body></html>`;
}

/* ============ GitHub publish (EXPLICIT, confirmed only) ============ */
async function ghPublish(html, member, role, batch, onStatus){
  const token=getKey('github'); if(!token) throw new Error('Missing GitHub PAT (Settings)');
  let repo=slugify(member+'-'+role)+'-candidates';
  if(batch>1) repo+='-b'+batch;            // batch → new repo/tab rule
  const headers={'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json'};
  onStatus&&onStatus('Checking repo '+repo+'…');
  let exists=false;
  try{const c=await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}`,{headers});exists=c.ok;}catch(e){}
  if(!exists){
    onStatus&&onStatus('Creating repo '+repo+'…');
    const cr=await fetch(`https://api.github.com/orgs/${GH_ORG}/repos`,{method:'POST',headers,
      body:JSON.stringify({name:repo,private:false,auto_init:false,description:`${role} candidates for ${member} — Sagan`})});
    if(!cr.ok && cr.status!==422) throw new Error('Create repo: '+(await cr.text()).slice(0,160));
  }
  // get existing sha if file present
  let sha=null;
  try{const g=await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}/contents/index.html`,{headers});if(g.ok)sha=(await g.json()).sha;}catch(e){}
  onStatus&&onStatus('Uploading page…');
  const content=btoa(unescape(encodeURIComponent(html)));
  const put=await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}/contents/index.html`,{method:'PUT',headers,
    body:JSON.stringify({message:'Publish presentation',content,...(sha?{sha}:{})})});
  if(!put.ok) throw new Error('Upload: '+(await put.text()).slice(0,160));
  onStatus&&onStatus('Enabling GitHub Pages…');
  try{await fetch(`https://api.github.com/repos/${GH_ORG}/${repo}/pages`,{method:'POST',headers,
    body:JSON.stringify({source:{branch:'main',path:'/'}})});}catch(e){}
  return `https://${GH_ORG}.github.io/${repo}/`;
}
