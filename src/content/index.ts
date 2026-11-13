/**
 * Post-to-Card Content Script Entry Point.
 * Manifest V3 Content Script executed on Twitter/X pages.
 * Fully integrates Twitter adapter, Shadow DOM container, and export engine.
 */

import { initTwitterInjection, resolveThread } from './adapter/index.ts';
import { openCardModal } from './container/element.ts';
import { createExportHandler } from './exportHandler.ts';
import { initGraphQLBridge } from './graphql/bridge.ts';

/**
 * The mark that says this script ran, for the verifier and for a person with
 * devtools open.
 *
 * It used to be a `console.log`. That prints into the page's console on every X
 * page load for every user of the extension, which is noise nobody asked for;
 * one attribute on `<html>` says the same thing to the only readers who want it.
 * The visibility class `injection.ts` puts on the same element is the precedent
 * -- this is not a new kind of footprint.
 */
export const ACTIVE_ATTR = 'data-post-to-card';

/**
 * X's media carousel (five or more pictures) mounts a slide's `tweetPhoto`
 * wrapper only once the picture decodes. Clicked before that, the DOM channel
 * reports no media at all; the GraphQL channel normally answers first, so this
 * only matters when the bridge missed the payload.
 */
const CAROUSEL_LIST = '[data-testid="ScrollSnap-List"]';
const TWEET_PHOTO = 'div[data-testid="tweetPhoto"]';
const CAROUSEL_WAIT_MS = 1000;

/**
 * True while X's media carousel is still mounting its pictures.
 *
 * The carousel (five or more pictures) creates a slide's `tweetPhoto` wrapper
 * only once the picture decodes; before that the DOM channel sees the slides but
 * no media. A partially decoded set counts as waiting, because extracting it
 * would print the pictures that happened to land first.
 */
function carouselWaitingForPictures(article: Element): boolean {
  const slides = article.querySelectorAll(`${CAROUSEL_LIST} > div[role="presentation"]`);
  if (slides.length === 0) return false;
  return article.querySelectorAll(TWEET_PHOTO).length < slides.length;
}

/**
 * Waits, bounded, for a rendered carousel to expose every picture.
 *
 * "Ready" means every slide has its `tweetPhoto`, not merely the first. The
 * timeout is a ceiling for a picture that never arrives, not an expected wait —
 * the thumbnails are already in flight.
 */
function waitForCarouselMedia(article: Element, slideCount: number): Promise<void> {
  if (typeof MutationObserver !== 'function') return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      observer.disconnect();
      resolve();
    };
    const ready = () => article.querySelectorAll(TWEET_PHOTO).length >= slideCount;
    const observer = new MutationObserver(() => {
      if (ready()) finish();
    });
    const timer = setTimeout(finish, CAROUSEL_WAIT_MS);
    observer.observe(article, { childList: true, subtree: true });
  });
}

/**
 * Opens the card for one post.
 *
 * The common path is synchronous: the card opens in the click's own turn, which
 * is what the popup's message handler and the trigger both expect. Only a
 * carousel whose pictures have not decoded defers, and it re-reads the post
 * once they have.
 */
function openCardFor(article: Element): void {
  const resolved = resolveThread(article);
  const hasMedia = resolved.tweets.some((tweet) => (tweet.media?.length ?? 0) > 0);

  if (hasMedia || !carouselWaitingForPictures(article)) {
    openCardModal(resolved, createExportHandler(resolved));
    return;
  }

  const slideCount = article.querySelectorAll(`${CAROUSEL_LIST} > div[role="presentation"]`).length;
  void waitForCarouselMedia(article, slideCount).then(() => {
    const threadData = resolveThread(article);
    openCardModal(threadData, createExportHandler(threadData));
  });
}

function initContentScript(): void {
  try {
    document.documentElement.setAttribute(ACTIVE_ATTR, 'true');

    // Must be installed before the page issues its own GraphQL calls.
    initGraphQLBridge();

    const controller = initTwitterInjection((article: Element) => {
      void openCardFor(article);
    });

    // Supplementary scans for dynamic SPA feed hydration
    setTimeout(() => controller.injectAll(), 500);
    setTimeout(() => controller.injectAll(), 1500);

    // Listen for extension messages (e.g. from popup or background)
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Only this extension's own contexts may open a card on this page. The
        // check is a bug-catcher rather than a defence -- `onMessage` does not
        // carry other extensions' messages -- but it is the same one line at
        // both ends of the channel, so neither can drift into trusting a sender
        // the other does not.
        if (sender?.id !== chrome.runtime.id) return false;
        if (message?.type === 'TRIGGER_ACTIVE_CARD') {
          const success = controller.triggerActiveTweet();
          sendResponse({ success });
          return false;
        }
        return false;
      });
    }
  } catch (err) {
    console.error('[Post-to-Card] Initialization error:', err);
  }
}

if (typeof window !== 'undefined') {
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContentScript);
  } else {
    initContentScript();
  }
}
