import { describe, expect, it } from "vitest";
import { workingHoursRows } from "./working-hours";
const weekdays = [1,2,3,4,5].map(weekday=>({weekday,start_time:"08:00:00",end_time:"18:00:00"}));
describe("public working hours",()=>{
 it("groups Monday to Friday and keeps Saturday and Sunday separate",()=>{const rows=workingHoursRows([...weekdays,{weekday:6,start_time:"09:00:00",end_time:"13:00:00"}]);expect(rows).toEqual([{label:"Lundi – Vendredi",times:"08h00 – 18h00",closed:false},{label:"Samedi",times:"09h00 – 13h00",closed:false},{label:"Dimanche",times:"Fermé",closed:true}]);});
 it("does not group days with different shifts",()=>{const rows=workingHoursRows(weekdays.map(slot=>slot.weekday===3?{...slot,end_time:"12:00:00"}:slot));expect(rows.map(row=>row.label)).toEqual(["Lundi – Mardi","Mercredi","Jeudi – Vendredi","Samedi","Dimanche"]);expect(rows[1].times).toBe("08h00 – 12h00");});
 it("preserves lunch breaks and sorts shifts",()=>{const rows=workingHoursRows([{weekday:1,start_time:"14:00:00",end_time:"18:00:00"},{weekday:1,start_time:"08:00:00",end_time:"12:00:00"}]);expect(rows[0].times).toBe("08h00 – 12h00 / 14h00 – 18h00");});
});
