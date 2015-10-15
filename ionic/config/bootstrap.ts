import {bootstrap, provide} from 'angular2/angular2';
import {ROUTER_PROVIDERS, LocationStrategy, HashLocationStrategy} from 'angular2/router';

import {IonicApp} from '../components/app/app';
import {IonicConfig} from './config';
import {IonicPlatform} from '../platform/platform';
import {OverlayController} from '../components/overlay/overlay-controller';
import {IonicForm} from '../util/form';
import {IonicKeyboard} from '../util/keyboard';
import {ActionSheet} from '../components/action-sheet/action-sheet';
import {Modal} from '../components/modal/modal';
import {Popup} from '../components/popup/popup';
import {Events} from '../util/events';
import {NavRegistry} from '../components/nav/nav-registry';
import {Translate} from '../translation/translate';
import {ClickBlock} from '../util/click-block';
import {TapClick} from '../components/tap-click/tap-click';
import * as dom from '../util/dom';


export function ionicProviders(config) {
  let app = new IonicApp();
  let platform = new IonicPlatform();

  if (!(config instanceof IonicConfig)) {
    config = new IonicConfig(config);
  }

  platform.url(window.location.href);
  platform.userAgent(window.navigator.userAgent);
  platform.navigatorPlatform(window.navigator.platform);
  platform.load();
  config.setPlatform(platform);

  let events = new Events();
  let tapClick = new TapClick(app, config, window, document);

  setupDom(window, document, config, platform);
  bindEvents(window, document, platform, events);

  // prepare the ready promise to fire....when ready
  platform.prepareReady(config);

  return [
    provide(IonicApp, {useValue: app}),
    provide(IonicConfig, {useValue: config}),
    provide(IonicPlatform, {useValue: platform}),
    provide(TapClick, {useValue: tapClick}),
    provide(Events, {useValue: events}),
    IonicForm,
    IonicKeyboard,
    OverlayController,
    ActionSheet,
    Modal,
    Popup,
    Translate,
    NavRegistry,
    ROUTER_PROVIDERS,
    provide(LocationStrategy, {useClass: HashLocationStrategy}),
  ];
}


function setupDom(window, document, config, platform) {
  let bodyEle = document.body;
  if (!bodyEle) {
    return dom.ready(function() {
      applyBodyCss(document, config, platform);
    });
  }

  let versions = platform.versions();
  platform.platforms().forEach(platformName => {
    // platform-ios
    let platformClass = 'platform-' + platformName;
    bodyEle.classList.add(platformClass);

    let platformVersion = versions[platformName];
    if (platformVersion) {
      // platform-ios9
      platformClass += platformVersion.major;
      bodyEle.classList.add(platformClass);

      // platform-ios9_3
      bodyEle.classList.add(platformClass + '_' + platformVersion.minor);
    }
  });

  // set the mode class name
  // ios/md
  bodyEle.classList.add(config.get('mode'));

  // touch devices should not use :hover CSS pseudo
  // enable :hover CSS when the "hoverCSS" setting is not false
  if (config.get('hoverCSS') !== false) {
    bodyEle.classList.add('enable-hover');
  }

  /**
  * Hairline Shim
  * Add the "hairline" CSS class name to the body tag
  * if the browser supports subpixels.
  */
  if (window.devicePixelRatio >= 2) {
    var hairlineEle = document.createElement('div');
    hairlineEle.style.border = '.5px solid transparent';
    bodyEle.appendChild(hairlineEle);

    if (hairlineEle.offsetHeight === 1) {
      bodyEle.classList.add('hairlines');
    }
    bodyEle.removeChild(hairlineEle);
  }

}


/**
 * Bind some global events and publish on the 'app' channel
 */
function bindEvents(window, document, platform, events) {
  window.addEventListener('online', (ev) => {
    events.publish('app:online', ev);
  }, false);

  window.addEventListener('offline', (ev) => {
    events.publish('app:offline', ev);
  }, false);

  window.addEventListener('orientationchange', (ev) => {
    events.publish('app:rotated', ev);
  });

  // When that status taps, we respond
  window.addEventListener('statusTap', (ev) => {
    // TODO: Make this more better
    var el = document.elementFromPoint(platform.width() / 2, platform.height() / 2);
    if(!el) { return; }

    var content = dom.closest(el, 'scroll-content');
    if(content) {
      var scrollTo = new ScrollTo(content);
      scrollTo.start(0, 0, 300, 0);
    }
  });

  // start listening for resizes XXms after the app starts
  setTimeout(function() {
    window.addEventListener('resize', function() {
      platform.windowResize();
    });
  }, 2000);
}