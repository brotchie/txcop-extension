function initiateSigning() {
  window.ethereum
      .request({
        method: 'personal_sign',
        params: ['0xdeadbeef', '0xF880d49e1CC0f82A95EFB0F41750964f94baD274', '']
      })
      .then((result) => console.log(result));
}


const signButton = document.getElementById('sign');
signButton.onclick = function() {
  initiateSigning();
};