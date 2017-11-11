import * as electronPath from 'electron';
import * as path from 'path';

const { Application } = require('spectron');


describe('main window', function spec() {
  let app: any;
  beforeAll(async () => {
    app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..', '..', 'app')],
    });
    return app.start();
  });

  afterAll(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });
});
