const playerElement = document.getElementById('player-wrapper')

const player = new Clappr.Player({
  source: 'http://clappr.io/highline.mp4',
  poster: 'http://clappr.io/poster.png',
  playback: { controls: true },
  plugins: [window.CastSenderPlugin],
})

player.attachTo(playerElement)
