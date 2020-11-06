import { Events, UICorePlugin, Log, version } from '@clappr/core'
import { embedScript } from './utils'
import { CAST_SENDER_LIB_URL, PLAYER_STATE } from './constants'

export default class CastSenderPlugin extends UICorePlugin {
  get name() { return 'cast_sender' }

  get supportedVersion() { return { min: version } }

  get playback() { return this.core.activePlayback }

  constructor(core) {
    super(core)
    this.fetchCastSenderLib()
  }

  fetchCastSenderLib() {
    embedScript(CAST_SENDER_LIB_URL).then(
      () => {
        Log.info('CastSenderPlugin', 'Cast Sender Lib successfully loaded!')
        window.__onGCastApiAvailable = isAvailable => isAvailable && this.initializeCastApi()
      },
      data => Log.error('CastSenderPlugin', 'Cast Sender Lib failed to load:', data),
    )
  }

  initializeCastApi() {
    cast.framework.CastContext.getInstance().setOptions({ receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID })

    this.remotePlayer = new cast.framework.RemotePlayer()
    this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer)
    this.remotePlayerController.addEventListener(
      cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
      () => {
        if (cast && cast.framework && this.remotePlayer.isConnected) {
          this.container.pause()
          this.setupRemotePlayer()
        }
      },
      { once: true },
    )
  }

  bindEvents() {
    this.stopListening()
    this.listenTo(this.core, Events.CORE_ACTIVE_CONTAINER_CHANGED, this.onContainerChanged)
  }

  bindContainerEvents() {
    this.container && this.listenTo(this.container, Events.CONTAINER_ENDED, this.test)
  }

  onContainerChanged() {
    this.container && this.stopListening(this.container)
    this.container = this.core.activeContainer
    this.bindContainerEvents()
  }

  setupRemotePlayer() {
    this.bindCastEvents()
  }

  bindCastEvents() {
    this.remotePlayerController.addEventListener(
      cast.framework.RemotePlayerEventType.MEDIA_INFO_CHANGED,
      () => this.onMediaInfoChanged,
    )

    cast.framework.CastContext.getInstance().getCurrentSession().getSessionState() === cast.framework.SessionState.SESSION_RESUMED
      ? this.remotePlayerController.playOrPause()
      : this.loadMediaOnReceiver()
  }

  onMediaInfoChanged() {
    console.log('>>> onMediaInfoChanged called')
    const session = cast.framework.CastContext.getInstance().getCurrentSession()
    if (!session) {
      this.mediaInfo = null
      this.isLiveContent = false
      this.disableSenderDisplay()
      return
    }

    const media = session.getMediaSession()
    if (!media) {
      this.mediaInfo = null
      this.isLiveContent = false
      this.disableSenderDisplay()
      return
    }

    this.mediaInfo = media.media
    media.playerState === PLAYER_STATE.PLAYING && this.remotePlayer.isPaused && this.remotePlayerController.playOrPause()

    this.enableSenderDisplay()
  }

  enableSenderDisplay() {
    console.log('>>> enableSenderDisplay called') // eslint-disable-line
  }

  loadMediaOnReceiver() {
    const mediaInfo = new chrome.cast.media.MediaInfo(this.playback._src, this.playback._typeFor(this.playback._src))

    mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED
    mediaInfo.metadata = new chrome.cast.media.TvShowMediaMetadata()
    mediaInfo.metadata.title = 'title'
    mediaInfo.metadata.subtitle = 'subtitle'
    mediaInfo.metadata.images = [{ url: this.options.poster }]

    const request = new chrome.cast.media.LoadRequest(mediaInfo)
    request.currentTime = this.currentMediaTime

    cast.framework.CastContext.getInstance().getCurrentSession().loadMedia(request)
      .then(
        () => console.log('>>>>>> Remote media loaded'), // eslint-disable-line
        () => console.log('>>>>>> Remote media load error'), // eslint-disable-line
      )
  }

  test() {
    console.log('>>> container created') // eslint-disable-line
  }
}
