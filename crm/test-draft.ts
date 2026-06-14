import { draftMessage } from './src/lib/ai/draft-message.js';

async function main() {
  try {
    const result = await draftMessage({
      channel: 'SMS',
      tone: 'friendly',
      offerDescription: 'win-back discount',
      segmentDescription: 'city equals Mumbai AND tags contains churn-risk',
    });
    console.log(result);
  } catch (err) {
    console.error(err);
  }
}
main();
