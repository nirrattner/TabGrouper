const TAB_GROUP_LIST_SELECTOR = ".tab-group-list";
const TEXT_INPUT_SELECTOR = ".text-input";

const tabGroupListElement = document.querySelector(TAB_GROUP_LIST_SELECTOR);
const textInputElement = document.querySelector(TEXT_INPUT_SELECTOR);

let currentTab = null;
let renderedTabGroups = [];
let selectedTabGroupIndex = 0;
let tabGroups = [];
let hasNonMatchingQuery = false;

function compareTabGroups(tabGroup1, tabGroup2) {
  const title1 = tabGroup1.title.toUpperCase();
  const title2 = tabGroup2.title.toUpperCase();
  if (title1 < title2) {
    return -1;
  }
  if (title1 > title2) {
    return 1;
  }
  return 0;
}

function renderTabGroupList() {
  tabGroupListElement.innerHTML = "";

  renderedTabGroups.map((tabGroup, index) => {
    const tabGroupElement = document.createElement("li");
    if (index === selectedTabGroupIndex) {
      tabGroupElement.className = "list-group-item active";
    } else {
      tabGroupElement.className = "list-group-item";
    }
    tabGroupElement.innerHTML = tabGroup.title;
    tabGroupListElement.appendChild(tabGroupElement);
  });
}

function keyHandler(keyEvent) {
  console.log(keyEvent);
  keyEvent = keyEvent || window.event;
  if (keyEvent.key == 'ArrowUp'
      && selectedTabGroupIndex > 0) {
    selectedTabGroupIndex--;
    renderTabGroupList();
  }
  if (keyEvent.key == 'ArrowDown'
      && selectedTabGroupIndex < renderedTabGroups.length - 1) {
    selectedTabGroupIndex++;
    renderTabGroupList();
  }
  if (keyEvent.key == 'Enter') {
    if (hasNonMatchingQuery && selectedTabGroupIndex === 0) {
      chrome.tabs.group({
          tabIds: [currentTab.id]})
        .then(tabGroupId => 
          chrome.tabGroups.update(tabGroupId, {title: textInputElement.value}))
        .then(tabGroup => {
          window.close();
        });
      return;
    }
    chrome.tabs.group({
        groupId: renderedTabGroups[selectedTabGroupIndex].id,
        tabIds: [currentTab.id]})
      .then(tabGroupId => {
        window.close();
      });
  }
}

function filterInputHandler(value) {
  selectedTabGroupIndex = 0;
  if (value) {
    renderedTabGroups = tabGroups.filter(tabGroup => 
        tabGroup.title.toUpperCase()
            .includes(value.toUpperCase()));
    hasNonMatchingQuery = !renderedTabGroups.some(tabGroup => tabGroup.title == value);
    console.log(hasNonMatchingQuery);
    if (hasNonMatchingQuery) {
      renderedTabGroups = [{title: `Create "${value}"`}, ...renderedTabGroups];
    }
  } else {
    renderedTabGroups = tabGroups;
    hasNonMatchingQuery = false;
  }
  renderTabGroupList();
}

textInputElement.disabled = true;

chrome.tabGroups.query({})
  .then(tabGroupsResult => {
    tabGroups = tabGroupsResult.sort(compareTabGroups);
    renderedTabGroups = tabGroups;
    renderTabGroupList();

    chrome.tabs.query({active: true, lastFocusedWindow: true})
      .then(tab => {
        currentTab = tab[0];

        console.log(currentTab);
        
        document.onkeydown = keyHandler;
        textInputElement.disabled = false;
        textInputElement.focus();
        textInputElement.addEventListener("input", () => filterInputHandler(textInputElement.value));
      });
  });

