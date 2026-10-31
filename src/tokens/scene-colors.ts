// Three.js materials, lights and the canvas-drawn operations screen read their colors
// from CSS custom properties defined in src/tokens/colors.css. The values are resolved
// once, on first use, and then cached: never call this per frame.
// Values are sRGB CSS colors; three.js converts them to linear working space exactly
// as it did for the former inline hex strings.
const TOKENS={
  prankJelly:'--scene-prank-jelly',prankStapler:'--scene-prank-stapler',prankPlate:'--scene-prank-plate',
  backdrop:'--scene-backdrop',hemisphereSky:'--scene-hemisphere-sky',hemisphereGround:'--scene-hemisphere-ground',contactShadow:'--scene-contact-shadow',
  teamPm:'--color-team-pm',teamDeveloper:'--color-team-developer',teamLead:'--color-team-lead',teamQa:'--color-team-qa',teamCto:'--color-team-cto',teamIt:'--color-team-it',
  potBody:'--scene-pot-body',potStem:'--scene-pot-stem',potLeafDark:'--scene-pot-leaf-dark',potLeafLight:'--scene-pot-leaf-light',
  chairMetal:'--scene-chair-metal',deskChair:'--scene-desk-chair',meetingChair:'--scene-meeting-chair',
  deskTop:'--scene-desk-top',deskLeg:'--scene-desk-leg',deskDrawer:'--scene-desk-drawer',deskHandle:'--scene-desk-handle',
  monitor:'--scene-monitor',monitorSecond:'--scene-monitor-second',monitorStand:'--scene-monitor-stand',
  screenActive:'--scene-screen-active',screenActiveGlow:'--scene-screen-active-glow',screenIdle:'--scene-screen-idle',
  keyboard:'--scene-keyboard',keyboardKey:'--scene-keyboard-key',
  avatarSkin:'--scene-avatar-skin',avatarHair:'--scene-avatar-hair',avatarHairLead:'--scene-avatar-hair-lead',avatarEye:'--scene-avatar-eye',avatarGlasses:'--scene-avatar-glasses',avatarLeg:'--scene-avatar-leg',avatarShoe:'--scene-avatar-shoe',
  routeActive:'--scene-route-active',routeIdle:'--scene-route-idle',packet:'--scene-packet',handoff:'--scene-handoff',
  opsFrame:'--scene-ops-frame',opsScreen:'--scene-ops-screen',opsTitle:'--scene-ops-title',opsStatus:'--scene-ops-status',opsCounts:'--scene-ops-counts',
  mailPost:'--scene-mail-post',mailBody:'--scene-mail-body',mailSlot:'--scene-mail-slot',mailFlagUp:'--scene-mail-flag-up',mailFlagDown:'--scene-mail-flag-down',letter:'--scene-letter',letterFlap:'--scene-letter-flap',
  outboxBase:'--scene-outbox-base',outboxTop:'--scene-outbox-top',outboxRail:'--scene-outbox-rail',outboxPaper:'--scene-outbox-paper',
  plinth:'--scene-plinth',floor:'--scene-floor',floorPlank:'--scene-floor-plank',wallBack:'--scene-wall-back',wallSide:'--scene-wall-side',wallTrim:'--scene-wall-trim',
  rugDevelopment:'--scene-rug-development',rugQa:'--scene-rug-qa',rugPm:'--scene-rug-pm',rugLead:'--scene-rug-lead',
  tableGround:'--scene-table-ground',tableTop:'--scene-table-top',tableBase:'--scene-table-base',tablePaper:'--scene-table-paper',tableTablet:'--scene-table-tablet',
  whiteboard:'--scene-whiteboard',whiteboardSheet:'--scene-whiteboard-sheet',noticeBoard:'--scene-notice-board',noteSand:'--scene-note-sand',noteSage:'--scene-note-sage',noteClay:'--scene-note-clay',
  shelf:'--scene-shelf',shelfBoard:'--scene-shelf-board',bookSage:'--scene-book-sage',bookWheat:'--scene-book-wheat',bookSky:'--scene-book-sky',
  cabinet:'--scene-cabinet',cabinetTop:'--scene-cabinet-top',cabinetHandle:'--scene-cabinet-handle',
  sofa:'--scene-sofa',cushion:'--scene-cushion',coffeeStation:'--scene-coffee-station',coffeeCounter:'--scene-coffee-counter',coffeeMachine:'--scene-coffee-machine',coffeeCup:'--scene-coffee-cup',
  partitionLead:'--scene-partition-lead',partitionPm:'--scene-partition-pm',lampPole:'--scene-lamp-pole',lampShade:'--scene-lamp-shade',bench:'--scene-bench',
  coworkerShirtA:'--scene-coworker-shirt-a',coworkerShirtB:'--scene-coworker-shirt-b',coworkerSkinA:'--scene-coworker-skin-a',coworkerSkinB:'--scene-coworker-skin-b',coworkerHairA:'--scene-coworker-hair-a',coworkerHairB:'--scene-coworker-hair-b',
  coworkerLeg:'--scene-coworker-leg',coworkerShoe:'--scene-coworker-shoe',coworkerCup:'--scene-coworker-cup',coworkerCoffee:'--scene-coworker-coffee',
  ctoFloor:'--scene-cto-floor',ctoFloorPlank:'--scene-cto-floor-plank',ctoWallBack:'--scene-cto-wall-back',ctoWallSide:'--scene-cto-wall-side',ctoRug:'--scene-cto-rug',
  goalsFrame:'--scene-goals-frame',goalsBoard:'--scene-goals-board',goalFirst:'--scene-goal-first',goalNext:'--scene-goal-next',goalLater:'--scene-goal-later',goalSomeday:'--scene-goal-someday',
  ideasSofa:'--scene-ideas-sofa',ideasTable:'--scene-ideas-table',ideasPaper:'--scene-ideas-paper',reports:'--scene-reports',
  bookcase:'--scene-bookcase',bookcaseShelf:'--scene-bookcase-shelf',ctoBookSage:'--scene-cto-book-sage',ctoBookTan:'--scene-cto-book-tan',ctoBookSky:'--scene-cto-book-sky',ctoBookMauve:'--scene-cto-book-mauve',
} as const;
export type SceneColors=Record<keyof typeof TOKENS,string>;
let cache:SceneColors|null=null;
export function sceneColors():SceneColors{
  if(cache)return cache;
  const style=getComputedStyle(document.documentElement);
  const resolved=Object.fromEntries(Object.entries(TOKENS).map(([key,name])=>{
    const value=style.getPropertyValue(name).trim();
    if(!value)throw new Error(`Scene color token ${name} is not defined`);
    return [key,value];
  })) as SceneColors;
  return cache=resolved;
}
export const SCENE_COLOR_TOKENS=TOKENS;
