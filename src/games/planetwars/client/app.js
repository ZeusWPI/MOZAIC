const Blockly = require('planetwars-blockly');
const Visualizer = require('planetwars-visualizer');
const FileSaver = require('file-saver');

const BLOCKLY_STATE = 'BLOCKLY';
const VISUALIZER_STATE = 'VISUALIZER';

class PlanetwarsClient {
  constructor() {
    this.blockly = Blockly.inject('blockly');
    this.visualizer = new Visualizer();

    // TODO: put this somewhere else
    // TODO: please don't do this every save
    this.blockly.addChangeListener(e => {
      window.localStorage.setItem('blocklyCode', this.blockly.getXml());
    });

    let xml = window.localStorage.getItem('blocklyCode');
    if (xml) {
      this.blockly.loadXml(xml);
    }

    // controls
    this.switch_view_state = document.getElementById('switch_view_state');
    this.switch_view_state.addEventListener('click', e => this.switch_view_stateHandler(e));
    this.save_btn = document.getElementById('save');
    this.save_btn.addEventListener('click', e => this.saveHandler(e));
    this.load_btn = document.getElementById('load');
    this.load_btn.addEventListener('click', e => this.loadHandler(e));
    this.opponent_field = document.getElementById('opponent');
    this.opponent_field.addEventListener('change', e => this.opponent = this.opponent_field.value);
    this.getOpponents((res) => {
      Array.forEach(res.players, (player, index) => {
        var el = document.createElement("option");
        el.textContent = player;
        el.value = player;
        this.opponent_field.appendChild(el);
      })
    });

    // User name
    var names = ['sadeerstejaar', 'klojo', 'darthvaderwannabe', 'nietbert', 'deterpawyndt']
    var default_name = names[Math.floor(Math.random() * names.length)];
    this.name_field = document.getElementById('uname');
    this.name_field.addEventListener('change', e => this.user_name = this.name_field.value);
    this.name_field.value = default_name; 
    this.user_name = this.name_field.value; // Make sure initial name is set

    this.blockly_div = document.getElementById('blockly');
    this.visualizer_div = document.getElementById('visualizer');

    // initial state
    this.setState(BLOCKLY_STATE);
  }

    getOpponents(callback){
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", 'players');
      xmlhttp.setRequestHeader("Content-type", "application/json");
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
          if (xmlhttp.status == 200) {
            callback(JSON.parse(xmlhttp.responseText));
          } else {
            console.log(xmlhttp);
            alert(`Problem fetching players ${xmlhttp.status} ${xmlhttp.responseText}`);
          }
        }
      };
      xmlhttp.send();
  }

  setState(state) {
    this.state = state;
    if (state == BLOCKLY_STATE) {
      this.blockly_div.classList.remove('invisible');
      this.visualizer_div.classList.add('invisible');
      this.switch_view_state.innerHTML = fa_icon('play');
    } else if (state == VISUALIZER_STATE) {
      this.blockly_div.classList.add('invisible');
      this.visualizer_div.classList.remove('invisible');
      this.switch_view_state.innerHTML = fa_icon('code');
    }
  }

  saveHandler(e) {
    console.log("SAVE");
    var xml = this.blockly.getXml();
    var file = new File([xml], "bot.xml", {type: "text/xml;charset=utf-8"});
    FileSaver.saveAs(file);
  }

  loadHandler(e) {
    console.log("LOAD");
    var fileSelect = document.getElementById('file-input');
    fileSelect.click();
    fileSelect.onchange = () => {
        var reader = new FileReader();
        reader.onload = (event) => {
          this.blockly.clear();
          var xml = event.target.result;
          this.blockly.loadXml(xml);
        };
        reader.readAsText(fileSelect.files[0]);
      };
  }    
  
  switch_view_stateHandler(e) {
    if (this.state == BLOCKLY_STATE) {
      this.submitCode(res => {
        // visualize game
        this.visualizer.visualize(res);
        this.setState(VISUALIZER_STATE);
        this.visualizer.play();
      });
    } else if (this.state == VISUALIZER_STATE) {
      this.setState(BLOCKLY_STATE);
      window.dispatchEvent(new Event('resize'));
      this.visualizer.pause();
    }
  }

  submitCode(callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", 'bot');
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200) {
          callback(xmlhttp.responseText);
        } else {
          console.log(xmlhttp);
          alert(`ERROR ERROR ${xmlhttp.status} ${xmlhttp.responseText}`);
        }
      }
    };

    console.log(this.blockly.getCode());

    var request = JSON.stringify({
      "code": this.blockly.getCode(),
      "name": this.user_name
    });
    xmlhttp.send(request);
  }

}

function fa_icon(name) {
  return '<i class="fa fa-' + name + '" aria-hidden="true"></i>';
}

window.onload = function() {
  new PlanetwarsClient();
};
