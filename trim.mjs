import sharp from 'sharp';

async function run() {
  try {
    const info = await sharp('src/assets/strawberry-bg.jpg')
      .extract({ left: 15, top: 15, width: 986, height: 822 })
      .toFile('src/assets/strawberry-bg-trimmed.jpg');
    console.log("Extract success:", info);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
