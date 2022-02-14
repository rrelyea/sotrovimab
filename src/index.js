import reportWebVitals from './reportWebVitals';
import Papa from 'papaparse';
import React from 'react';
import ReactDOM from 'react-dom'
import MapChart from "./MapChart";
import allStates from "./data/allstates.json";

const styles = {
  countyCity: {
    fontSize: '14pt'
  },
  providerTable: {
    marginLeft: '10px',
    marginTop: '30px',
    marginBottom: '30px',
    margin: '0 auto',
  },
  doseCount: {
    fontSize: '14pt',
    verticalAlign: 'bottom'
  },
  doseLabel: {
    verticalAlign: 'top',
  },
  mediumFont: {
    fontSize: '14pt'
  },  
  smallFont: {
    fontSize: '12pt'
  },
  smallerFont: {
    fontSize: '10pt'
  },
  tinyFont: {
    fontSize: '5pt'
  },  
  chooseState: {
    fontSize: '18pt'
  },
  mapDiv: {
    margin: '0 auto',
    height: '250px',
    width: '350px',
  },
  centered: {
    textAlign: 'center',
  },
  td: {
    verticalAlign: 'top',
    wordWrap: 'break-word',
  },
  // table color theme started with primary color of #f1ec90 and used https://material.io/design/color/the-color-system.html#tools-for-picking-colors
  th: {
    position: 'sticky',
    backgroundColor: '#9095f1',
    top: '0px',
    zIndex: 2,
    fontSize: '20px'
  },
  odd: {
    background: 'white',
  },
  even: {
    background: '#f1ec90',
  },
  stateInfo: {
    textAlign: 'left',
    paddingLeft: '10px',
  },
  infoLabels: {
    backgroundColor: '#f1bb90',
    textAlign: 'right',
    paddingRight: '10px',
  },
  totals: {
    lineHeight: '60px',
    padding: '0 0',
    backgroundColor: '#f1bb90',
  },
}

var state_filter = "ALL";

function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

function toNumber(str) {
  if (str.trim() === "") {
    return "--";
  }
  else
  {
    return parseFloat(str).toFixed(0);
  }
}

function GetStateDetails(states, providers) {
  const StateDetails = states.map((state,index) => {
    return GetProviderDetails(state, index, providers);
  })
  if (state_filter !== "")
  {
    return (
      <table style={styles.providerTable}>
        <thead>
        <tr>
          <th style={styles.th}>State / Territory</th>
          <th style={styles.th} colSpan='2'>Health Dept Links</th>
        </tr>
        </thead>
        {StateDetails}
      </table>);
  }
  else
  {
    return <div></div>
  }
}

function toDate(str) {
  if (str.trim() === "") {
    return "--";
  }
  else
  {
    var dateString = (new Date(str)).toDateString();
    var dateLength = dateString.length;
    return dateString.substring(0, dateLength - 5);
  }
}

function SwapKeyword(url, keyword) {
  return url.replace("KEYWORD", keyword)
}

function GetProviderDetails(state, index, providers) {
  switch (state_filter) {
    case null:
    case "":
      return null
    case "ALL":
    case state[3].trim():
      break;
    default:
      return null;
  }

  if (state[3].trim() === "") return null;

  var lastCity = "";
  var lastCityStyle = null;
  var firstLink = 0;
  return <tbody>
             { state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
          <tr>
            <td style={styles.infoLabels}>
              {state[2]}
            </td>
            <td style={styles.stateInfo} colSpan='2'>
              <span>{state[10] !== ""? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+state[10]}>{state[9]}</a></span> : false }</span>
              <span>{state[7] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+SwapKeyword(state[7],'Covid Therapeutics')}>'Covid Therapeutics' search</a></span> : false }</span>
              <span>{state[7] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+SwapKeyword(state[7],'Sotrovimab')}>'Sotrovimab' search</a></span> : false }</span>
              <span>{state[8] !== ""? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+state[8]}>Covid Info</a></span> : false }</span>
              <span>{state[0] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={"https://"+state[0]}>{state[0]}</a></span> : false }</span>
              <span>{state[5] !== "" ? <span><span> {firstLink++ === 0?"":"|"} </span><a href={"mailto:"+state[5]}>{state[5]}</a></span> : ""}</span>  
              <span>{state[6] !== "" ? " | " + state[6] : ""}</span> 
              <span>{state[4] !== "" ? <span> | <a href={"https://twitter.com/"+state[4]}>{'@'+state[4]}</a></span> : false } </span> 
            </td>
          </tr>
          : false
         }
       {
        providers !== null ? providers.map((provider, index) => {
          // skip blank lines
          if (provider.length === 1) 
          {
            return false;
          }

          const provider_state = provider[5].trim();
          var countyCity = null;
          var provider_x = null;
          var state_code = state[3] !== null ? state[3].trim() : state[3];
          var county = provider[4] !== null ? provider[4].trim() : provider[4];
          var city = provider[3] !== null ? provider[3].trim() : provider[3];

          if (provider_state === state_code) {
            if (lastCity !== toTitleCase(city)) {
              lastCity = toTitleCase(city);
              countyCity = state_code + " / " + toTitleCase(county) + " / " + toTitleCase(city);
              lastCityStyle = lastCityStyle === styles.odd ? styles.even : styles.odd;
            }
            
            provider_x = toTitleCase(provider[0]);

            var remaining = toNumber(provider[12]);
            var ordered = toNumber(provider[11]);
            var npi = provider[15].trim() === "" ? "" : "NPI# " + parseInt(provider[15]);
            return   <tr key={state_code+"-"+index.toString()} style={lastCityStyle}>
                        <td style={styles.td}>
                          <div style={styles.countyCity}>{countyCity}</div>
                        </td>
                      <td style={styles.td}>
                        <div style={styles.mediumFont}>{provider_x}</div>
                        <div>{provider[1]}</div>
                        <div>{provider[2]}</div>
                        <div>{provider[6]}</div>
                        <div>{npi}</div>
                      </td>
                      <td style={styles.td}>
                        <div><span style={styles.doseCount}>{remaining}</span> <span style={styles.doseLabel}> avail @{toDate(provider[13])}</span></div>
                        <div><span style={styles.doseCount}>{ordered}</span> <span style={styles.doseLabel}> allotted @{toDate(provider[9])}</span></div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;Last delivery: {toDate(provider[10])}</div>
                        <div style={styles.tinyFont}>&nbsp;</div>
                      </td>
                      </tr>
          }

        }
       ) : false }
       </tbody>
}

function navigateToState(state) {
  const params = new URLSearchParams(window.location.search);
  params.set('state', state);
  window.history.replaceState({}, "Sotrovimab (" + state + ")", `${window.location.pathname}?${params.toString()}`);
  renderPage(states, sotrovimabSites);
}

function renderPage(states, sotrovimabSites) {
  const handleChange = (e) => {
    navigateToState(e.target.value);
  }
  const mapClick = (e) => {
    var element = e.target;
    var state_code = null;
    if (element.tagName === "text")
    {
      state_code = element.innerHTML;
    }
    else if (element.tagName === "path")
    {
      var parent = element.parentElement;
      var index = Array.from(parent.children).indexOf(element);
      const cur = allStates.find(s => s.index === index);
      state_code = cur.id;
    }

    var chooseState = document.getElementById('chooseState');

    if (state_code !== null) {
      chooseState.value = state_code;
      navigateToState(state_code);  
    }
    else
    {
      chooseState.value = "ChooseState";
      navigateToState("");
    }
  }

  if (states != null)
  {
    var urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('state')) {
      state_filter = urlParams.get('state').toUpperCase();
    }


    var page = 
      <div>
        <div style={styles.centered}>
          <label style={styles.chooseState} htmlFor='chooseState'>Sotrovimab info for:&nbsp;</label>
          <select style={styles.mediumFont} id='chooseState' value={state_filter !== null ? state_filter.toUpperCase() : ""} onChange={(e) => handleChange(e)}>
            <option value="ChooseState">Choose State</option>
            {states.data.map((state,index) => 
              <option key={index} value={index > 0 ? state[3].trim(): "ALL"}>{index > 0 ? state[2].trim() + " (" + state[3].trim() + ")" : "All States & Territories"}</option>
            )} 
          </select>
          <div style={styles.smallFont}>
            Links from states/territories to help you and your doctor(s) find Sotrovimab if you need it.
          </div>
          <div onClick={mapClick} style={styles.mapDiv}>
            <MapChart id='mapChart' />
          </div>
          <div style={styles.smallerFont}>&nbsp;</div>
          <div>
              { 
                GetStateDetails(states.data, null)
              }
          </div>
          <div style={styles.smallerFont}>&nbsp;</div>
          <div style={styles.smallerFont}>
            Contact: <a href="https://twitter.com/rrelyea">@rrelyea</a> or <a href="mailto:rob@relyeas.net">rob@relyeas.net</a> | 
            Github repo for <a href="https://github.com/rrelyea/sotrovimab">this site</a> |
            Prevention locator: vaccine &amp; <a href="https://rrelyea.github.io/evusheld">evusheld</a> |
            Treatment locator: <a href="https://rrelyea.github.io/paxlovid">paxlovid</a>
          </div>
          <div style={styles.smallerFont}>
            Immunocompromised? Seek <a href="https://rrelyea.github.io/evusheld">Evusheld</a> with help from your doctor(s).
          </div>
        </div>
      </div>
      
    ReactDOM.render(page, document.getElementById('root'));
  }
}

var sotrovimabSites = null;

var states = null;

var currentTime = new Date();
var urlSuffix = currentTime.getMinutes() + "-" + currentTime.getSeconds();
Papa.parse("https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/state-health-departments.csv?"+urlSuffix, {
  download: true,
  complete: function(stateResults) {
    states = stateResults;
    renderPage(states, sotrovimabSites);
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
