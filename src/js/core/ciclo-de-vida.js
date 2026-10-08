  function refresh() {
    if (observer) observer.disconnect();

    try {
      update();
    } finally {
      if (observer) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [
            'hidden',
            'style',
            'class',
            'disabled',
            'readonly'
          ]
        });
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(refresh, 100);
  }

  window.CRPForm = {
    baseVersion: '2.0.0',
    atualizar: refresh
  };

  function start() {
    observer = new MutationObserver(schedule);
    document.addEventListener('change', schedule);
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
