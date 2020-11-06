export const embedScript = url => new Promise((resolve, reject) => {
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.async = true
  script.src = url
  script.onload = () => { resolve() }
  script.onerror = error => { reject({ error, script }) }
  document.head.appendChild(script)
})