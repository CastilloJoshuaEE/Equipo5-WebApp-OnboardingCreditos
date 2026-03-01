// backend/interfaces/controllers/WebhooksController.js
class WebhooksController {
  constructor(procesarWebhookDiditUseCase) {
    this.procesarWebhookDidit = procesarWebhookDiditUseCase;
  }

  async handleDiditWebhook(req, res) {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const payload = req.body;

    const result = await this.procesarWebhookDidit.execute(payload, signature, timestamp);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = WebhooksController;