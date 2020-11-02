import { UICorePlugin, Events, version } from '@clappr/core'

export default class CastSenderPlugin extends UICorePlugin {
  get name() { return 'cast_sender' }

  get supportedVersion() { return { min: version } }

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

  test() {
    console.log('>>> container created') // eslint-disable-line
  }
}
