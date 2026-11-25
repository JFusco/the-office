import {describe,expect,it} from 'vitest';
import {popPage,pushPage,renamePage,removePage,type DrawerPath} from '../../../../src/office/drawer/navigation';
import {drawerPageMotion} from '../../../../src/tokens/motion';
const root={id:'root',title:'Mailbox',trigger:null};
const initial:DrawerPath={entries:[root],previous:null,returning:false};
describe('drawer navigation',()=>{
  it('records each parent and reverses one level at a time',()=>{
    const list={id:'list',title:'With the team',trigger:null};
    const ticket={id:'ticket',title:'CEC-101',trigger:null};
    const first=pushPage(initial,list), second=pushPage(first,ticket);
    expect(second.entries).toEqual([root,list,ticket]);
    expect(popPage(second)).toEqual({entries:[root,list],previous:'ticket',returning:true,returnFocus:null});
    expect(popPage(first).entries).toEqual([root]);
  });
  it('returns to the originating trigger when a page disappears',()=>{
    const trigger = {} as HTMLElement;
    const ticket = {id:'ticket',title:'CEC-101',trigger};
    const evidence = {id:'evidence',title:'Evidence',trigger:null};
    const path = pushPage(pushPage(initial,ticket),evidence);
    expect(removePage(path,'ticket')).toEqual({
      entries:[root],previous:'evidence',returning:true,returnFocus:trigger,
    });
    expect(removePage(path,'other')).toBe(path);
  });
  it('ignores repeat activation and Back at the root',()=>{
    expect(pushPage(initial,root)).toBe(initial);
    expect(popPage(initial)).toBe(initial);
  });
  it('keeps the current page and original Back target when a live group is renamed', () => {
    const group = { id:'waiting', title:'Waiting on prerequisites', trigger:root.trigger };
    const ticket = { id:'ticket', title:'CEC-101', trigger:root.trigger };
    const path = pushPage(pushPage(initial, group), ticket);
    const updated = renamePage(path, group.id, 'Waiting for the next step');
    expect(updated.entries.at(-1)).toBe(ticket);
    expect(popPage(updated).entries.at(-1)).toEqual({ ...group, title:'Waiting for the next step' });
    expect(renamePage(updated, 'absent', 'New title')).toBe(updated);
  });
  it('uses the same easing in either direction and skips reduced motion',()=>{
    expect(drawerPageMotion(false)).toEqual({duration:.28,ease:[.22,1,.36,1]});
    expect(drawerPageMotion(true).duration).toBe(0);
  });
});
