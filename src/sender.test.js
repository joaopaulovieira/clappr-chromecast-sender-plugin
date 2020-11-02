import { Events, UICore, Container, Playback, version } from '@clappr/core'
import CastSenderPlugin from './sender.js'

const setupTest = (options = {}, fullSetup = false) => {
  const core = new UICore(options)
  const plugin = new CastSenderPlugin(core)
  core.addPlugin(plugin)

  const response = { core, plugin }
  fullSetup && (response.container = new Container({ playerId: 1, playback: new Playback({}) }))

  return response
}

describe('QueuePlugin', () => {
  test('is loaded on core plugins array', () => {
    const { core, plugin } = setupTest()
    expect(core.getPlugin(plugin.name).name).toEqual('cast_sender')
  })

  test('is compatible with the latest Clappr core version', () => {
    const { core, plugin } = setupTest()
    expect(core.getPlugin(plugin.name).supportedVersion).toEqual({ min: version })
  })

  test('is destroyed when Core is destroyed too', () => {
    const { core, plugin } = setupTest()
    jest.spyOn(plugin, 'destroy')
    core.destroy()

    expect(plugin.destroy).toHaveBeenCalled()
  })

  describe('bindEvents method', () => {
    test('stops the current listeners before add new ones', () => {
      const { plugin } = setupTest()
      jest.spyOn(plugin, 'stopListening')
      plugin.bindEvents()

      expect(plugin.stopListening).toHaveBeenCalledTimes(1)
    })

    test('register onContainerChanged method as callback for CORE_ACTIVE_CONTAINER_CHANGED event', () => {
      jest.spyOn(CastSenderPlugin.prototype, 'onContainerChanged')
      const { core, plugin } = setupTest()
      core.trigger(Events.CORE_ACTIVE_CONTAINER_CHANGED)

      expect(plugin.onContainerChanged).toHaveBeenCalledTimes(1)
    })
  })

  describe('bindContainerEvents method', () => {
    test('avoid register callback for events on container scope without a valid reference', () => {
      const { container, plugin } = setupTest({}, true)
      jest.spyOn(plugin, 'test')
      container.trigger(Events.CONTAINER_ENDED)

      expect(plugin.test).not.toHaveBeenCalled()
    })

    test('register playNextVideo method as callback for CONTAINER_ENDED event', () => {
      const { core, container, plugin } = setupTest({}, true)
      jest.spyOn(plugin, 'test')
      core.activeContainer = container
      container.trigger(Events.CONTAINER_ENDED)

      expect(plugin.test).toHaveBeenCalledTimes(1)
    })
  })

  describe('onContainerChanged method', () => {
    test('removes all listeners from old container reference', () => {
      const { core, container, plugin } = setupTest({}, true)
      jest.spyOn(plugin, 'stopListening')
      core.activeContainer = container
      plugin.onContainerChanged()

      expect(plugin.stopListening).toHaveBeenCalledWith(container)
    })

    test('saves core.activeContainer reference locally', () => {
      const { core, container, plugin } = setupTest({}, true)
      core.activeContainer = container
      plugin.onContainerChanged()

      expect(plugin.container).toEqual(core.activeContainer)
    })

    test('calls bindContainerEvents method', () => {
      const { plugin } = setupTest()
      jest.spyOn(plugin, 'bindContainerEvents')
      plugin.onContainerChanged()

      expect(plugin.bindContainerEvents).toHaveBeenCalledTimes(1)
    })
  })
})
