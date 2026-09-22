export class History {
  constructor(){
    this.steps = [];
    this.index = -1;
    this.timer = null;
  }
  setSteps(steps){
    this.steps = steps||[];
    this.index = steps.length?0:-1;
  }
  current(){ return this.steps[this.index]||null; }
  next(){
    if(this.index < this.steps.length-1){ this.index++; return this.current(); }
    return null;
  }
  prev(){
    if(this.index>0){ this.index--; return this.current(); }
    return null;
  }
  reset(){
    if(this.steps.length) this.index=0;
  }
  play(callback, interval=800){
    this.stop();
    this.timer = setInterval(()=>{
      if(this.index < this.steps.length-1){
        this.index++;
        callback(this.current(), this.index);
      } else {
        this.stop();
      }
    }, interval);
  }
  stop(){ if(this.timer){ clearInterval(this.timer); this.timer=null; } }
  get isPlaying(){ return !!this.timer; }
}
