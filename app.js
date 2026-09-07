const SCORE_KEY="ea_v21_score", DONE_KEY="ea_v21_done", TOPIC_KEY="ea_v21_topics", RECENT_KEY="ea_v21_recent";
const score=()=>Number(localStorage.getItem(SCORE_KEY)||0);
const readJSON=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(e){return d}};
const writeJSON=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function refresh(){document.querySelectorAll("[data-score]").forEach(e=>e.textContent=score())}
function add(n){localStorage.setItem(SCORE_KEY,String(score()+n));refresh()}
function done(id){let a=readJSON(DONE_KEY,[]);if(!a.includes(id)){a.push(id);writeJSON(DONE_KEY,a);add(5)}}
function getTopic(id){return readJSON(TOPIC_KEY,{})[id]||{unlocked:1,best:[0,0,0],passed:[false,false,false],attempts:[0,0,0]}}
function saveTopic(id,t){let a=readJSON(TOPIC_KEY,{});a[id]=t;writeJSON(TOPIC_KEY,a)}
function recentKey(t,s){return `${t}:${s}`}
function getRecent(t,s){return readJSON(RECENT_KEY,{})[recentKey(t,s)]||[]}
function setRecent(t,s,ids){let a=readJSON(RECENT_KEY,{});a[recentKey(t,s)]=ids;writeJSON(RECENT_KEY,a)}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function stageName(n){return n===1?"⭐ Understand":n===2?"⭐⭐ Apply":"⭐⭐⭐ Master"}
function levelName(n){return n===1?"Easy":n===2?"Medium":"Challenge"}
function passMark(n){return 96}
function showLesson(id){document.querySelectorAll('.lesson').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));document.getElementById(id)?.classList.add('active');document.querySelector(`[data-lesson="${id}"]`)?.classList.add('active');window.scrollTo({top:120,behavior:'smooth'})}
function wire(){document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>showLesson(b.dataset.lesson));refresh()}
function eaTopicState(topic){const all=JSON.parse(localStorage.getItem("ea_v21_topics")||"{}");return all[topic]||{unlocked:1,best:[0,0,0],passed:[false,false,false],attempts:[0,0,0]};}
function eaProgressMarkup(topic){const s=eaTopicState(topic),stars=(s.passed||[]).filter(Boolean).length,pct=Math.round(stars/3*100),names=["⭐ Understand","⭐⭐ Apply","⭐⭐⭐ Master"];return `<div class="course-progress"><div class="progress-head"><span>Topic progress</span><span>${stars}/3 mastery stages</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="mastery-map">${names.map((n,j)=>{const passed=s.passed&&s.passed[j],locked=(j+1)>(s.unlocked||1);return `<div class="mastery-pill ${passed?"passed":locked?"locked":""}">${n}<br>${passed?"Mastered ✓":locked?"Locked":((s.best&&s.best[j])||0)+"% best"}</div>`}).join("")}</div></div>`;}
function makeQuiz(rootId,bank,topicId){
 const root=document.getElementById(rootId);if(!root)return;let topic=getTopic(topicId),stage=Math.min(topic.unlocked,3),qs=[],i=0,finished=false,state=[];
 function buildSession(){
    const level=levelName(stage);
    const pool=bank.filter(q=>q.level===level);
    qs=shuffle(pool);
    i=0;finished=false;
    state=qs.map(()=>({answered:false,chosen:null,correct:false,starAwarded:false}));
  }
 function selector(){let t=getTopic(topicId);return `<div class="mastery-path">${[1,2,3].map(n=>{let locked=n>t.unlocked,passed=t.passed[n-1];return `<button class="stage-chip ${n===stage?'active':''} ${locked?'locked':''}" data-stage="${n}" ${locked?'disabled':''}><span>${stageName(n)}</span><small>${passed?'Passed ✓':locked?'Locked':`Best ${t.best[n-1]}%`}</small></button>`}).join('')}</div>`}
 function render(){
   const q=qs[i],s=state[i];root.innerHTML=`${selector()}<div class="stage-intro"><strong>${stageName(stage)}</strong><span>Pass mark: above 95% • ${qs.length} questions</span></div><div class="quiz-meta"><div><div class="qcount">Question ${i+1} of ${qs.length}</div><span class="level ${q.level}">${q.level}</span></div></div><div class="progressbar"><div style="width:${((i+1)/qs.length)*100}%"></div></div><div class="question">${q.q}</div><div class="answers">${q.a.map((x,j)=>{let cls='answer';if(s.answered){if(j===q.c)cls+=' correct';else if(j===s.chosen)cls+=' wrong'}return `<button class="${cls}" data-i="${j}" ${s.answered?'disabled':''}>${x}</button>`}).join('')}</div><div class="feedback" aria-live="polite">${s.answered?(s.correct?`✅ Correct! ${q.w}`:`💡 Not quite. ${q.w}`):'Choose an answer. Take your time.'}</div><div class="quiz-nav"><button class="btn secondary quiz-prev" ${i===0?'disabled':''}>← Previous</button><div class="tiny quiz-help">${s.answered?(i===qs.length-1?'Read the explanation, then finish.':'Read the explanation, then move on when ready.'):'Next unlocks after you answer.'}</div><button class="btn primary quiz-next" ${!s.answered?'disabled':''}>${i===qs.length-1?'Finish ✓':'Next →'}</button></div>`;
   root.querySelectorAll('.stage-chip:not(.locked)').forEach(b=>b.onclick=()=>{let n=+b.dataset.stage;if(n!==stage){stage=n;buildSession();render()}});
   if(!s.answered)root.querySelectorAll('.answer').forEach(b=>b.onclick=()=>{let chosen=+b.dataset.i;s.answered=true;s.chosen=chosen;s.correct=chosen===q.c;if(s.correct&&!s.starAwarded){add(2);s.starAwarded=true}render()});
   root.querySelector('.quiz-prev')?.addEventListener('click',()=>{if(i>0){i--;render();root.scrollIntoView({behavior:'smooth',block:'start'})}});
   root.querySelector('.quiz-next')?.addEventListener('click',()=>{if(!state[i].answered)return;if(i<qs.length-1){i++;render();root.scrollIntoView({behavior:'smooth',block:'start'})}else finish()});
 }
 function finish(){
   if(finished)return;finished=true;let correct=state.filter(x=>x.correct).length,pct=Math.round(correct/qs.length*100),needed=passMark(stage),passed=pct>=needed;topic=getTopic(topicId);topic.attempts[stage-1]++;topic.best[stage-1]=Math.max(topic.best[stage-1],pct);if(passed){topic.passed[stage-1]=true;if(stage<3)topic.unlocked=Math.max(topic.unlocked,stage+1);else done(topicId)}saveTopic(topicId,topic);
   root.innerHTML=`${selector()}<div class="result-card ${passed?'pass':'fail'}"><div class="qcount">${stageName(stage)} complete</div><div class="question">${passed?'🎉 Level passed':'🔁 Not mastered yet'} — ${correct}/${qs.length}</div><p><strong>${pct}%</strong> scored • <strong>${needed}%</strong> needed to pass.</p><p class="tiny">${passed?(stage<3?'Great work. The next mastery level is now unlocked. You can still replay this level any time.':'Excellent. You have mastered this topic.'):'This level stays active. The next level remains locked. Review the explanations, then retry with a fresh set.'}</p></div><div class="result-actions"><button class="btn secondary review">← Review answers</button><button class="btn primary retry">↻ Retry this level</button>${passed&&stage<3?`<button class="btn secondary nextlevel">Continue to ${stageName(stage+1)} →</button>`:''}</div>`;
   root.querySelector('.review').onclick=()=>{finished=false;i=qs.length-1;render()};
   root.querySelector('.retry').onclick=()=>{buildSession();render()};
   root.querySelector('.nextlevel')?.addEventListener('click',()=>{stage++;buildSession();render()});
   root.querySelectorAll('.stage-chip:not(.locked)').forEach(b=>b.onclick=()=>{stage=+b.dataset.stage;buildSession();render()});
 }
 buildSession();render();
}
document.addEventListener('DOMContentLoaded',wire);