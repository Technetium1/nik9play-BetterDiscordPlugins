module.exports = (Plugin, Library) => {
  const { Logger, DOMTools } = Library

  return class BetterPictureInPicture extends Plugin {

    onStart() {
      Logger.log('Started')
      this.setSize()
      // Logger.log(_.defaults({ 'a': 1 }, { 'a': 3, 'b': 2 }))
      if (this.settings['hideswitch']) {
        BdApi.injectCSS('betterpictureinpicturecss-hide', `div[class^="pictureInPictureWindow_"] {display:none!important}`)
      }

      BdApi.injectCSS('betterpictureinpicturecss-animation', `div[class^="pictureInPictureVideo_"] {transition: width .2s cubic-bezier(0.65,0.05,0.36,1), height .2s cubic-bezier(0.65,0.05,0.36,1);}`)
      BdApi.injectCSS('betterpictureinpicturecss', `div[class^="pictureInPictureVideo_"] {width: var(--bpip-width);height:var(--bpip-height)!important} div[class^="pictureInPictureWindow_"] > div {width: unset !important;}`)

      DOMTools.observer.subscribe(changes => {
        if (changes.addedNodes.length > 0) {
          Logger.log('PiP started.')
          this.onPipStarted(changes.addedNodes[0])
        }
        if (changes.removedNodes.length > 0) {
          Logger.log('PiP stopped.')
        }
      },
      changes => { return changes.target?.classList[0]?.startsWith('pictureInPicture_') }
      )

      function wheelSize(e) {
        if (this.settings['customswitch']) {
          let scaleX = parseFloat(this.settings['customwidth'])
          scaleX += e.deltaY * -0.1
          let scaleY = parseFloat(this.settings['customheight'])
          scaleY += e.deltaY * -0.05625

          this.settings['customwidth'] = scaleX
          this.settings['customheight'] = scaleY
        } else {
          let scale = parseFloat(this.settings['popupsize'])
          scale += e.deltaY * -0.1
          if (scale < 50) scale = 50
          if (scale > 300) scale = 300
          this.settings['popupsize'] = scale
        }
        this.setSize()
        this.saveSettings(this.settings)
      }

      this.wheelSize = wheelSize.bind(this)

      const window = DOMTools.query('div[class^="pictureInPictureWindow_"]')
      if (window)
        this.onPipStarted(window)
    }

    onStop() {
      Logger.log('Stopped')
      BdApi.clearCSS('betterpictureinpicturecss')
      BdApi.clearCSS('betterpictureinpicturecss-animation')
      BdApi.clearCSS('betterpictureinpicturecss-hide')
      BdApi.clearCSS('betterpictureinpicture-vars')

      DOMTools.observer.unsubscribeAll()

      const window = DOMTools.query('div[class^="pictureInPictureWindow_"]')
      window?.removeEventListener('wheel', this.wheelSize)
    }

    onPipStarted(target) {
      target.addEventListener('wheel', this.wheelSize)
    }

    setSize() {
      Logger.log('Size changed')
      BdApi.clearCSS('betterpictureinpicture-vars')
      if (this.settings['customswitch']) {
        BdApi.injectCSS('betterpictureinpicture-vars', `:root {--bpip-width: ${this.settings['customwidth']}px; --bpip-height: ${this.settings['customheight']}px;}`)
      } else {
        const width = 320 * (this.settings['popupsize'] / 100)
        const height = 180 * (this.settings['popupsize'] / 100)

        BdApi.injectCSS('betterpictureinpicture-vars', `:root {--bpip-width: ${width}px; --bpip-height: ${height}px;}`)      }
    }

    getSettingsPanel() {
      const panel = this.buildSettingsPanel()
      panel.onChange = (e, v) => {
        if (e === 'customwidth' || e === 'customheight') {
          if (isNaN(v)) {
            this.settings[e] = this.defaultSettings[e]
          }
        }

        if (this.settings['hideswitch']) {
          BdApi.clearCSS('betterpictureinpicturecss-hide')
          BdApi.injectCSS('betterpictureinpicturecss-hide', `div[class^="pictureInPictureWindow_"] {display:none!important}`)
        } else {
          BdApi.clearCSS('betterpictureinpicturecss-hide')
        }

        this.saveSettings(this.settings)
        this.setSize()
      }
      return panel.getElement()
    }
  }
}
