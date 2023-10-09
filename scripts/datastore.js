var crypto = require('crypto');
var fs = require('fs');
var https = require('https');
var path = require('path');
var tar = require('tar');

var registry = {
  'AdderallCities2015.csv': 'c3e984482cc6db1193a6dca2a55396a2baad8541a5c8c679f33750b76f766f40a119ec3e63abbabcd095d752c3df8ce21bf24cbe629502121f24ba90b4b0674c',
  'base-images.tgz': '8121b6f6a0a7e20e8f27b50277330c7dfe2a66eac9d0df525586cb30e8a58c28c9a3d55cd195cb0d7cb36f483bb0f3a7c964c78f919c132aceadf3449c40aba8',
  'blue.jpg': '867b1f3c568289efc7d0dba97d827a2bc4d83a7465cebcb3b5aec7bac6a38cf70d037d1814402bc97ad1f2f6737cfb5ce97db0a4fb53a716e77fd3ba57a7ab3b',
  'cities.csv': '5a665e5feda24f28e5cf4ed0801b67e73bbcf3ea781b2e50d11284214e67b25b68e6a1c48da46e5e4d4d0c54c2ec18f88d292224b4541fb279396cf7b94beac9',
  'earthquakes.json': 'f098b6437411384b552419b4a36264c1bb3fed816ccfe9545145175e0b92a0b7ad5ebdcb9dddd0a12a90499143ffa471c02f6e049be5b973db607ff066892500',
  'earthquakes-video.webm': '834a9d05f5fb00145e529fa4b217398db0df188c69d751f3869128b6e9c92d3000f85378752c56d9d9b5fa0870437dd9bdfeb5d62f6c87c2c03a7f1a20ee8523',
  'grid.jpg': '60d201a14c7d31e7881301e6784e0372ddf27f26e5e4eafba9ba39158dfd050e3683faaa660fcde47e6c994dd3ee64c5a5231474ca75090053ef9207fedd9029',
  'hurricanes.json': '012f15036bfc9ac3abb81a2a61e2c7b602ef3d8f7bd3b3f0fb66972ee69034730655f69febb2df5d657f22cd2b1e69170f6568bcbb03d7ebdecdfbafb80cc3b7',
  'land_polygons.json': '30a828392d58678599130e0dca6d7f27e7e07e4e5b5d7f7a37871eb395d53d97b76134c0a07e805fbdfac0f42e6d3ca6e287c9727815a9dc711d541b1c8f68a1',
  'land_shallow_topo_2048.png': '8a8330dba5bacdb511038ad0f6ee5a764a40aa7a8868a445749f653ae5d85d8317684ac706e7a9f049590170df6bc3fefc2912d52124d1b3b17aa43c529ff2a8',
  'noaa_prcp.json': '07b4e12f0a31c0f48ca42545e61324941be7df24bd521541250969dd3f14f4400a362601ea9ecb4220d9d3b731f01d75cf9a998682c43afbc63cc4a16c2cba2e',
  'oahu-dense.json': '692a44ec4a18b16d1530403a9a2bf286ff2ef7d45fa58f555c278f91a0fa708b5626a3f38955e06a11cdc06a1009e859328687c1f32a2169e0c8ef1b518418c1',
  'oahu.json': 'e44282c44fa95f0b40c2135ee94ff40a755771f3b4bf9acda0eef0048cd0fb29b3a71352e2eecdca6cfc35fafde96ffb1a9658c9fee2346071808a9123c26cb5',
  'oahu-medium.json': '83375c5c2678b11d8de7f59fd8e2f9b889d3ec20f4a81279d996711bfc0942bd9dcdce149cbca995930459c26b3bf58be60569687085adf361ff805436b75aab',
  'pixelmap_0_0_0.png': '67bc541c8f26de5b644d756bc517b31ef4187c1c609da5291fc446fa7e2ddcf40c75b93cdb6f2e579be596ac1215c5af802c9555474723d3b10713851fbb58e3',
  'pixelmap_1_0_0.png': '41ca6c789bd410b0ea4dd814c92eb6047c098fcc6a8f77c200604e2bff7b7847f6c740e3a411a957a03edc0dfe6ee1383f38c34dceacdfa3e9f6408b7187ee25',
  'pixelmap_1_0_1.png': 'a27aa667e482cd7a7800cbe9c2401b9fbf387bdc67a49b17be04f7aa2846e522aa64383383fb3413d9dc7206e3b90910ccc8d4454ac1b08ebcedc68182c49e99',
  'pixelmap_1_1_0.png': 'b3f020355093ca6fa450550fe9680f549a6dc327a568d439d59e620ee3f9a43b6c88913e5d9344e65bd896cce5494b864051359faaaa4704433d5d0c41da2a43',
  'pixelmap_1_1_1.png': '31060e137ea25029dc977c66af62becf5ab685a3ac254fd8a9953eaa71c9b20efe97cd2d9ba03389e0d5c90c2c6bbe46a43a99c4aef10159b0d3515ee80cf459',
  'red.jpg': '70884f5c3d1747633412dcf64d4886d985b49f508b68eb9f3874b2fdcfad38e7623f4a7c7355baa1656503f46e2e091576a19ded9fad7c7c65387c313206d2e6',
  'roads.json': 'ae8d8b99c3fab73798ddcc246ea53b1bc8d598414d00df4ce697373a343fbf7ffed4dbae5f07a997ac7731b5f86140686b8425b99bd5818b8c9ec68e7c4d3315',
  'sample.json': '5d4b00559f17fac607eafe4a9bb933386ebd572fbe545e6138b8eafbbf510074a8ae398c7df0420a017218af83b18cc322633b77007b63a27dfea7a50db70244',
  'temperature_data.tsv': 'bde5cdad7c4518694393de83da938bcf5d485b41116b51f0fce4b462737992d2973f076c577040fa816873b196c6397244aa03736fc7750a0eea0ba5cbcc48e4',
  'tilefancy.png': '455effa59d421cbb73c6def815813063f1c649363de4007fa0de00cc2e0f24cba745c046266e5a83fc43b121a648017d509d7bf03c30fbee1448817e3f849683',
  'tiles.tgz': 'b777fc6b206a89241250bbfeb17fd2dd36966c7697160c7be71bb5c769db88ae2a652874200f73aac3356bc3e09a878be1daf16e11c4178ddc685f8b4370d55e',
  'white.jpg': 'ea7a9d7ff76775e742572f89e90cce1248ec99c33b2f486e0fa1d19ab461b87dff324533ecb186a3db14e40a3826da97b5d66566360a201228f60140b0e89942'
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    var file = fs.createWriteStream(dest);
    https.get(url, function (response) {
      response.pipe(file);
      file.on('finish', function () {
        file.close(() => resolve(dest));
      });
    });
  });
}

function checksumFile(hashName, filepath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName);
    const stream = fs.createReadStream(filepath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function untgz(filepath) {
  var dest = filepath.substr(0, filepath.length - 4);
  fs.mkdirSync(dest, {recursive: true});
  return tar.x({file: filepath, cwd: dest});
}

var base_url = 'https://data.kitware.com/api/v1/file/hashsum/{algo}/{hashvalue}/download';
var algo = 'sha512';

var dest = process.argv[2];

fs.mkdirSync(dest, {recursive: true});
Object.entries(registry).forEach(async ([name, hash]) => {
  var outputPath = path.join(dest, name);
  var url = base_url.replace('{algo}', algo).replace('{hashvalue}', hash);
  var downloaded = false;
  for (var tries = 0; tries < 5; tries += 1) {
    if (tries) {
      console.log(`Downloading ${name}.`);
      await download(url, outputPath);
      downloaded = true;
    }
    if (fs.existsSync(outputPath)) {
      var existingHash = await checksumFile(algo, outputPath);
      if (hash.toLowerCase() === existingHash.toLowerCase()) {
        break;
      }
      if (tries) {
        console.log(`Checksum does not match for ${name}.`);
      }
    }
    downloaded = false;
  }
  if (downloaded && name.endsWith('tgz')) {
    await untgz(outputPath);
  }
});
