import reportWebVitals from './reportWebVitals';
import Papa from 'papaparse';
import React from 'react';
import ReactDOM from 'react-dom'
import MapChart from "./MapChart";
import allStates from "./data/allstates.json";
import DoseViewer from './DoseViewer.js'
import './index.css';

const styles = {
  countyCity: {
    fontSize: '14pt'
  },
  providerTable: {
    marginLeft: '10px',
    marginTop: '30px',
    marginBottom: '30px',
    margin: '0 auto',
    borderCollapse: 'collapse',
  },
  doseCount: {
    fontSize: '12pt',
    verticalAlign: 'bottom'
  },
  doseLabel: {
    verticalAlign: 'top',
  },
  mediumFont: {
    fontSize: '14pt'
  },
  smallerCentered: {
    fontSize: '10pt',
    textAlign: 'center',
  },
  smallerFont: {
    fontSize: '10pt'
  },
  eightPointFont: {
    fontSize: '8pt'
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
    maxWidth: '100px',
    verticalAlign: 'top',
    wordWrap: 'break-word',
  },
  tdChart: {
    maxWidth: '250px',
    verticalAlign: 'top',
    wordWrap: 'break-word',
  },
  tdProvider: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'top',
  },
  // table color theme started with primary color of #f1ec90 and used https://material.io/design/color/the-color-system.html#tools-for-picking-colors
  th: {
    position: 'sticky',
    backgroundColor: '#9095f1',
    top: '0px',
    zIndex: 2,
    fontSize: '20px',
  },
  odd: {
    background: 'white',
  },
  even: {
    background: '#f1ec90',
  },
  stateInfo: {
    backgroundColor: '#f1bb90',
    textAlign: 'left',
  },
  infoLabels: {
    backgroundColor: '#f1bb90',
    textAlign: 'right',
    paddingRight: '10px',
  },
  totals: {
    padding: '0 0',
    backgroundColor: '#f1bb90',
  },
  textArea: {
    height: 300,
    width: 600,
    whiteSpace: 'pre-line',
    background: 'lightyellow'
  }
}

var stateFilter = null;
var countyFilter = null;
var cityFilter = null;
var zipFilter = null;
var providerFilter = null;
var body = "";
var pageLocation = "";
var dataUpdated = null;
var site = "Sotrovimab";
var siteLower = "sotrovimab";

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
  if (stateFilter !== null || zipFilter !== null || providerFilter !== null || cityFilter != null || countyFilter !== null)
  {
    return (
      <table style={styles.providerTable}>
        <thead>
        <tr>
          <th style={styles.th}>&nbsp;State - County - City&nbsp;</th>
          <th style={styles.th}>Provider</th>
          <th style={styles.th}>Doses</th>
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
  const updateTextArea = () =>  {
    var mailtoLink = document.getElementById("mailtoLink");
    var textArea = document.getElementById("textArea");
    body = textArea.value;
    var subject = "Info about: " + toTitleCase(providerFilter)+' ('+zipFilter + ')';
    var email="evusheld-data@relyeas.net" 

    let params = subject || body ? '?' : '';
    if (subject) params += `subject=${encodeURIComponent(subject)}`;
    if (body) params += `${subject ? '&' : ''}body=${encodeURIComponent(body)}`;
    mailtoLink.href= `mailto:${email}${params}`;
  }
  if (state[3].trim() === "") return null;

  var allottedTotal = 0;
  var availableTotal = 0;
  var unreportedTotal = 0;
  var providerCountTotals = 0;
  var firstLink = 0;

  var state_code = state[3] !== null ? state[3].trim() : state[3];

  var lastCity = "";
  var lastCounty = "";
  var lastState = "";
  var lastCityStyle = null;
  var cityMarkup = null;
  var providerList = providers.map((provider, index) => {
    // ignore blank lines in provider file
    if (provider.length === 1) 
    {
      return false;
    }

    const provider_state = provider[5].trim();
    var provider_x = null;
    var county = provider[4] !== null ? provider[4].trim() : provider[4];
    var city = provider[3] !== null ? provider[3].trim() : provider[3];

    if (provider_state === state_code) { 
      if ((stateFilter === null || stateFilter === state_code) 
         && (zipFilter === null || zipFilter === provider[6].substring(0,5))
         && (countyFilter === null || countyFilter === county.toUpperCase())
         && (cityFilter === null || cityFilter === city.toUpperCase())
         ) {
          
          var providerUpper = provider[0].replaceAll('-',' ').toUpperCase();
          provider_x = toTitleCase(provider[0]);
          if (providerFilter === null || providerUpper.includes(providerFilter) ) {
            var linkToProvider = "?zip=" + provider[6].substring(0,5) + "&provider=" + provider_x.replaceAll(' ', '-');
            var linkToState = "?state=" + state_code;
            var zipCode = provider[6].substring(0,5);
            var linkToCounty = linkToState + "&county=" + county;
            var linkToCity = linkToState + "&city=" + city;
            var firstRowOfCity = lastCity !== toTitleCase(city) || lastCounty !== county || lastState !== state_code;
            if (firstRowOfCity) {
              lastCity = toTitleCase(city); 
              lastState = state_code;
              lastCounty = county;
              cityMarkup = 
              <div style={styles.countyCity}>
                <a href={linkToState}>{state_code}</a><br/>
                <a href={linkToCounty}>{toTitleCase(county)}</a><br/>
                <a href={linkToCity}>{toTitleCase(city)}</a>
              </div>;
              lastCityStyle = lastCityStyle === styles.odd ? styles.even : styles.odd;
            } else {
              cityMarkup = null;
            }
            var allotted = toNumber(provider[11]);
            var available = toNumber(provider[12]);
            var npi = provider[15].trim() === "" ? "" : "NPI# " + parseInt(provider[15]);
            allottedTotal += allotted === "--" ? 0 : parseInt(allotted);
            availableTotal += available === "--" ? 0 : parseInt(available);
            unreportedTotal += available === "--" ? parseInt(allotted):0;
            providerCountTotals += 1;

            return <><tr key={state_code+"-"+index.toString()} style={lastCityStyle}>
              <td style={styles.td}>
                {cityMarkup}
              </td>
              <td style={styles.tdProvider}>
                <div style={styles.mediumFont}><a href={linkToProvider}>{provider_x}</a></div>
                <div>{toTitleCase(provider[1])}</div>
                { zipFilter !== null && providerFilter !== null ? <div>{toTitleCase(provider[2])}</div> : false }
                { zipFilter !== null && providerFilter !== null ? <div>{provider[6]}</div> : false }
                { zipFilter !== null && providerFilter !== null ? <div>{npi}</div> : false }
                <div style={styles.tinyFont}>&nbsp;</div>
              </td>
              <td style={styles.tdChart}>
                { zipFilter !== null && providerFilter !== null ? (<>
                  <div><span style={styles.doseCount}>{available}</span> <span style={styles.doseLabel}> avail @{toDate(provider[13])}</span></div>
                  <div><span style={styles.doseCount}>{allotted}</span> <span style={styles.doseLabel}> allotted @{toDate(provider[9])}</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;Last delivery: {toDate(provider[10])}</div>
                  <div style={styles.tinyFont}>&nbsp;</div>
                </>) :
                (
                <>
                <a href={linkToProvider}>
                  <DoseViewer zipCode={zipCode} provider={providerUpper} mini='true' available={available} allotted={allotted} site={siteLower} />
                </a>
                </>
                )}
              </td>
            </tr>
            {zipFilter !== null && providerFilter !== null && pageLocation==="" ?
              <tr style={lastCityStyle}>
                <td colSpan='3'>
                  <DoseViewer zipCode={zipFilter} provider={providerUpper} site={siteLower} />
                </td>
              </tr>
              :false
            }
            {zipFilter !== null && providerFilter !== null && site === "Evusheld" ?
              <tr style={lastCityStyle}>
                <td colSpan='3'>
                  <br/>
                  <h3>Add Info about Provider to Help Others</h3>
                  <div>You can help others by adding information about this provider!</div>
                  <ol>
                    <li>Fill out answers to questions in the yellow area below. Don't include information you wouldn't want published.</li>
                    <li>(Don't change the question text, as a computer will read the answers.)</li>
                    <li>Once you fill out the info, press the "Send this info" link below, then review and send the email.</li>
                  </ol>
                  If step 3 fails, do these manual steps to send the data to me:
                  
                  <ol>
                    <li>Create an email to: evusheld-data@relyeas.net</li>
                    <li>Make the subject exactly the following: "{"Info about: " + toTitleCase(providerFilter)+' ('+zipFilter + ')"'}</li>
                    <li>Copy and Paste the questions/answers from the yellow area below to the body of the message</li>
                    <li>Send that message!</li>
                  </ol>
                  <div>
                    I will publish some of this info to the Evusheld community on this site, to help others. I will not share your name or email address.</div>
                <textarea onChange={()=>updateTextArea()} id='textArea' style={styles.textArea} defaultValue={'Evusheld Site Url: ' + window.location + '\nProvider\'s main web page: \nProvider\'s evusheld web page: \nProvider main phone #: \nProvider phone # for Evusheld: \nProvider email for Evusheld: \nDid you get Evusheld dose here? \nProviders in network instructions: \nProvider out of network instructions: \nDid they require a prescription? \nAre you in a waiting list to get a dose here? \nInfo about different priority groups in wait list: \nInfo about who they will give Evusheld to: \nOther info that will help others: \n'}></textarea>
                <br/>
                <a id='mailtoLink' target='_blank'>
                  Send this info
                </a>
                </td>
              </tr>
              :false
            }
            {zipFilter !== null && providerFilter !== null && pageLocation!=="" && site === "Evusheld" ?
              <tr style={lastCityStyle}>
                <td colSpan='3'>
                  <DoseViewer zipCode={zipFilter} provider={providerUpper} />
                </td>
              </tr>
              :false
            }
            </>
          
        }
      }
    }
  });

  var header = state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
  <tr>
    <td style={styles.infoLabels}>
      {state[2]} Health Dept:
    </td>
    <td style={styles.stateInfo} colSpan='2'>
    <span>{state[7] !== "" ? <span>{firstLink++ === 0?"":"|"} <a href={'https://'+SwapKeyword(state[7], site)}>{"'" + site + "' search"}</a></span> : false }</span>
      <span>{state[8] !== ""? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={'https://'+state[8]}>Covid Info</a></span> : false }</span>
      <span>{state[0] !== "" ? <span>&nbsp;{firstLink++ === 0?"":"|"} <a href={"https://"+state[0]}>{state[0]}</a></span> : false }</span>
      <span>{state[5] !== "" ? <span><span> | </span><a href={"mailto:"+state[5]}>{state[5]}</a></span> : ""}</span>  
      <span>{state[6] !== "" ? " | " + state[6] : ""}</span> 
      <span>{state[4] !== "" ? <span> | <a href={"https://twitter.com/"+state[4]}>{'@'+state[4]}</a></span> : false } </span> 
    </td>
  </tr>
  : false;

  // calculate population for state per 100k people.
  var pop100ks = state[11]/100000;
  var totals = state.length > 1 && state[2] != null && state[2].trim() !== "state" ?
  <tr style={styles.totals}>
    <td style={styles.infoLabels}>{cityFilter !== null ? "City":(countyFilter !== null?"County":(zipFilter!=null?"Zip":(stateFilter != null ? "State":"")))} Totals:</td>
    <td style={styles.centered}>{providerCountTotals} providers</td>
    <td style={styles.doseCount}>
      {'Allotted: '+ allottedTotal + (state[11] !== '' ? ' (' + (allottedTotal / pop100ks).toFixed(1) +' /100k)' : "")}<br/>
      {(availableTotal/allottedTotal*100).toFixed(0) + '% Available: ' + availableTotal + (state[11] !== '' ? ' (' + (availableTotal / pop100ks).toFixed(1) +' /100k)' : "")}<br/>
      {(unreportedTotal/allottedTotal*100).toFixed(0) + '% Unreported: '+ unreportedTotal + (state[11] !== '' ? ' (' + (unreportedTotal / pop100ks).toFixed(1) +' /100k)' : "")}<br/>
    </td>
  </tr>
  : false;

  return <tbody>
       { stateFilter !== null && state_code === stateFilter ? header : false }
       { (stateFilter !== null && state_code===stateFilter) && (zipFilter !== null || countyFilter !== null || cityFilter !== null | stateFilter !== null) ? totals : false}
       { providerList }
       </tbody>
}

function navigateToState(state) {
  const params = new URLSearchParams(window.location.search);
  if (state !== "ChooseState" && state !== "" && state !== null) { params.set('state', state) } else if (params.has('state')) params.delete('state');
  if (params.has('county')) params.delete('county');
  if (params.has('city')) params.delete('city');
  if (params.has('zip')) params.delete('zip');
  if (params.has('provider')) params.delete('provider');

  window.history.replaceState({}, null, `${window.location.pathname}?${params.toString()}`);
  renderPage(states, mabSites);
}

function renderPage(states, mabSites) {
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

  if (states != null && mabSites != null)
  {
    var urlParams = new URLSearchParams(window.location.search);

    stateFilter = urlParams.has('state') ? urlParams.get('state').toUpperCase() : null;
    countyFilter = urlParams.has('county') ? urlParams.get('county').toUpperCase() : null;
    cityFilter = urlParams.has('city') ? urlParams.get('city').toUpperCase() : null;
    zipFilter = urlParams.has('zip') ? urlParams.get('zip') : null;
    providerFilter = urlParams.has('provider') ? urlParams.get('provider').toUpperCase().replaceAll('-',' ') : null;
    pageLocation = window.location.hash;

    if (zipFilter !== null && providerFilter !== null) {
      document.title = toTitleCase(providerFilter);
    } else {
      if (stateFilter !== null && countyFilter !== null) document.title = stateFilter + "/" + toTitleCase(countyFilter) + " " + site;
      else if (stateFilter !== null && cityFilter !== null) document.title = stateFilter + "/" + toTitleCase(cityFilter) + " " + site;
      else if (stateFilter !== null) document.title = stateFilter + " " + site;
      else document.title = site;
    }
    var linkToState = stateFilter !== null ? "?state=" + stateFilter : window.location.pathname.split("?")[0];
    var page = 
      <div>
        <div >

          { zipFilter === null || providerFilter === null ?
            <>
              <div style={styles.centered}>
                <label style={styles.chooseState} htmlFor='chooseState'>{site} providers in:&nbsp;</label>
                <select style={styles.mediumFont} id='chooseState' value={stateFilter !== null ? stateFilter.toUpperCase() : ""} onChange={(e) => handleChange(e)}>
                  <option value="ChooseState">Choose State</option>
                  {states.data.map((state,index) => 
                    <option key={index} value={index > 0 ? state[3].trim(): "--"}>{index > 0 ? state[2].trim() + " (" + state[3].trim() + ")" : "--"}</option>
                  )} 
                </select>
              </div>
              { countyFilter !== null ? <div style={styles.centered}>County: {toTitleCase(countyFilter)} <a href={linkToState}>(show all)</a> </div> : false }
              { cityFilter !== null ? <div style={styles.centered}>City: {toTitleCase(cityFilter)} <a href={linkToState}>(show all)</a> </div> : false }
              { providerFilter !== null ? <div style={styles.centered}>Provider contains '{providerFilter}' <a href={linkToState}>(show all)</a> </div> : false }
              { zipFilter !== null ? <div style={styles.centered}>Zip Code: {zipFilter} <a href={linkToState}>(show all)</a> </div> : false }
              <div onClick={mapClick} style={styles.mapDiv}>
                <MapChart id='mapChart' />
              </div>
            </>
          : false }

          <div>
            { providerFilter !== null ? <><div style={styles.centered}>Provider: {providerFilter}</div><div>&nbsp;</div></> : false }
            <div style={styles.smallerCentered}>
              [Data harvested from <a href="https://healthdata.gov/Health/COVID-19-Public-Therapeutic-Locator/rxn6-qnx8">healthdata.gov</a>, which last updated: {dataUpdated}]
            </div>
            <div style={styles.smallerCentered}>&nbsp;</div>
            { GetStateDetails(states.data, mabSites.data) }
          </div>
          {zipFilter === null && providerFilter === null ?
          <>
          <div style={styles.smallerCentered}>&nbsp;</div>
          <div style={styles.smallerCentered}>
            ( view same data in <a href="https://covid-19-therapeutics-locator-dhhs.hub.arcgis.com/">a searchable map (HHS)</a>, <a href="https://1drv.ms/x/s!AhC1RgsYG5Ltv55eBLmCP2tJomHPFQ?e=XbsTzD"> Microsoft Excel</a>, <a href="https://docs.google.com/spreadsheets/d/14jiaYK5wzTWQ6o_dZogQjoOMWZopamrfAlWLBKWocLs/edit?usp=sharing">Google Sheets</a>, <a href="https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/evusheld-data.csv">CSV File</a>, or <a href="https://healthdata.gov/Health/COVID-19-Public-Therapeutic-Locator/rxn6-qnx8/data">healthdata.gov</a> ) |             Treament locators: <a href="https://rrelyea.github.io/sotrovimab">sotrovimab</a> and <a href="https://rrelyea.github.io/paxlovid">paxlovid</a>
          </div>
          </>
          : false }
          <div style={styles.smallerFont}>&nbsp;</div>
          <div style={styles.smallerCentered}>
            Contact <a href="https://twitter.com/rrelyea">@rrelyea</a> or <a href="mailto:rob@relyeas.net">rob@relyeas.net</a> or <a href='https://buymeacoffee.com/rrelyea'>buy me a coffee</a> |
            Open source: <a href={"https://github.com/rrelyea/"+site.toLowerCase()}>this site</a> and <a href="https://github.com/rrelyea/evusheld-locations-history">git-scraping</a>
          </div>
          <div style={styles.smallerCentered}>&nbsp;</div>
        </div>
      </div>
      
    ReactDOM.render(page, document.getElementById('root'));
  }
}

var mabSites = null;
Papa.parse("https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/"+site.toLowerCase()+"-data.csv", {
  download: true,
  complete: function(mabResults) {
    mabSites = mabResults;
    renderPage(states, mabSites);
  }
});

var states = null;
var baseUri = "https://raw.githubusercontent.com/rrelyea/evusheld-locations-history/main/";

var currentTime = new Date();
var urlSuffix = currentTime.getMinutes() + "-" + currentTime.getSeconds();
Papa.parse(baseUri + "state-health-departments.csv?"+urlSuffix, {
  download: true,
  complete: function(stateResults) {
    states = stateResults;
    renderPage(states, mabSites);
  }
});

Papa.parse(baseUri + "data/therapeutics-last-processed.txt", {
  download: true,
  complete: function(lastProcessedData) {
    // parse date as UTC, but it is really eastern time, so add 5 hours to have correct UTC time.
    var dataUpdatedDate = new Date(lastProcessedData.data[0] + 'Z');
    dataUpdatedDate.setHours(dataUpdatedDate.getHours() + 5);

    // create string with local time/date
    dataUpdated = dataUpdatedDate.toLocaleString('en-US', {weekday: 'short', month: 'numeric', day:'numeric', hour:'numeric', minute:'numeric', timeZoneName: 'short' });
    renderPage(states, mabSites);
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
