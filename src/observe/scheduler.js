let queue = [] // 存放要更新的 watcher
let has = {} // 存放已有的 watcher 的 id

let pending = false
export function queueWatcher(watcher) {
  let id = watcher.id
  if(has[id] === null) {
    has[id] = true;
    queue.push(watcher);
    if(!pending) {
      setTimeout(() => {
        queue.forEach(watcher => watcher.run());
          queue = [] 
          has = {}
          pending = false
      },0)

      pending = true
    }
  }
}