drop function IF EXISTS SPLIT_STR ;
drop function IF EXISTS production_forecast;
drop table IF EXISTS temp_forecast_analysis;
CREATE TABLE
    temp_forecast_analysis
    (
        parent_date VARCHAR(20),
        del_date VARCHAR(10),
        qty INT,
        capacity INT,
        adjusted INT,
        prev_adjusted INT,
        post_adjusted INT,
        remaining INT,
        del_count INT,
        deliveries INT,
        trial_no INT,
        color VARCHAR(10),
        status VARCHAR(10),
        return_code VARCHAR(300)
    )
    ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE
    temp_log
    (
        comment1 VARCHAR(500),
        comment2 VARCHAR(500)
    )
    ENGINE=InnoDB DEFAULT CHARSET=latin1

delimiter $$
CREATE FUNCTION `SPLIT_STR`(
  x VARCHAR(255),
  delim VARCHAR(12),
  pos INT
) RETURNS varchar(255) CHARSET latin1
    DETERMINISTIC
RETURN REPLACE(SUBSTRING(SUBSTRING_INDEX(x, delim, pos),
       LENGTH(SUBSTRING_INDEX(x, delim, pos -1)) + 1),
       delim, '');
$$

delimiter $$
CREATE FUNCTION `production_forecast`(pitem_code varchar(300)) RETURNS varchar(255) CHARSET latin1
    DETERMINISTIC
Begin
declare vDelivery_date varchar(20);
declare vqty  integer;
declare vrqty  integer;
declare vCapacity integer;
declare rCapacity integer;
declare rstr varchar(1000) default '';
declare mstr varchar(1000) default '';
declare bDate varchar(100);
declare bQty integer;
declare bRqty integer;
declare no_more_rows integer default 0;
declare del_no integer default 0;
declare i integer;
declare vPending integer default 0;
declare date_cur date default date(now());
declare date_cur_str varchar(20);
declare return_string varchar(300) default '';
declare fDate varchar(20);
declare fQty integer;
declare fAdjusted integer;
declare dAdjusted integer;
declare dRemaining integer;
declare vTrials integer;
declare vCount integer default 0;
declare v2Count integer default 1;
declare vPrevAdjusted integer;
declare vPostAdjusted integer;
declare vAdjusted integer;
declare vDeliveries integer;
declare vPrevCount integer;
declare vPostCount integer;
declare vRemCount integer;
declare vColorDesc varchar(20);
declare vHolidayFlag int default 0;
declare cursor1 cursor for 
SELECT sii.tailoring_delivery_date,SUM(sii.tailoring_qty) AS qty,SUM(sii.tailoring_qty) AS rqty from `tabSales Invoice Items` sii where sii.docstatus=1 and   tailoring_delivery_date IS NOT NULL and sii.tailoring_item_code=pitem_code and not exists(select true from `tabProduction Dashboard Details` pdd where sales_invoice_no=sii.parent and article_code=sii.tailoring_item_code and pdd.process_status='Completed' ) GROUP BY  sii.tailoring_delivery_date ORDER BY sii.tailoring_delivery_date; 
declare continue handler for not found  set no_more_rows := 1; 
SELECT SUM(sii.tailoring_qty)  into vPending from `tabSales Invoice Items` sii where sii.docstatus=1 and  sii.tailoring_delivery_date IS NOT NULL and sii.tailoring_item_code=pitem_code and not exists(select true from `tabProduction Dashboard Details` pdd where sales_invoice_no=sii.parent and article_code=sii.tailoring_item_code and pdd.process_status='Completed' ) ; 
select round(8/(sum(time)/60)) into vCapacity from(select process,(1/(sum(1/time))) as time from tabEmployeeSkill where item_code=pitem_code  group by  process)foo;
set vCapacity:=coalesce(vCapacity,0);
open cursor1; 
LOOP1: loop 
        fetch cursor1 into vDelivery_date,vqty,vrqty;        
        if no_more_rows=1 then 
                close cursor1;
                leave LOOP1;  
        end if;
        set rstr:=concat(rstr,vDelivery_date,':',vqty,':',vrqty,';');  
        
    end loop LOOP1;
/* This logic calculate number of deliveries which will use in looping and processing preProceesees,PostProccessed,currentProccessed items.
number of ';' will be delieveries count.
*/    

set mstr:=rstr;
set mstr   :=trim(trailing ';' FROM mstr);
set del_no := LENGTH(mstr) - LENGTH(REPLACE(mstr, ';', '')) +1;

/*
Total pending amount will be calculated as per vPending stored in upper section.
we will process to enter datewise data of preProceesees,PostProccessed,currentProccessed till vPending becomes zero.

*/
insert into temp_log(comment1) values(vCapacity);
while vPending>0 and vCapacity>0 do

set date_cur_str := date_format(date(date_cur),'%Y-%m-%d');
insert into temp_log(comment1) values(vCapacity);
/*
if vPending>vCapacity then
set vPending := vPending-vCapacity;
else 
set vPending:=0;
end if;
*/
set vPending := vPending-vCapacity;
set rCapacity := vCapacity;
set i:=1;
set vPostAdjusted:=0;
set vPrevAdjusted:=0;
set fAdjusted :=0;

if (select true from tabHoliday where holiday_date=date_cur_str) then
 set vHolidayFlag :=1;
else
 set vHolidayFlag :=0;
end if; 

/* Process all deliveries dates using del_no till remaining capacity becomes zero.
If proccessed date is holiday,then skip and process another date.
*/


while i<=del_no and rCapacity>0 and vHolidayFlag=0 do

/* SPLIT_STR used to extract part of string seperated by given character.
i is used to index in split part to extract part number from string.
if remaining capacity is more than bRqty then set bRqty =0 which will set remaining quantity=0 and ramining capacity will be capacity-processed qty(bRqty)
if remaining capacity is less than bRqty then set rCapacity=0 and enter remaining quanty in production forecast table and consider next date.
*/
set bDate :=SPLIT_STR(SPLIT_STR(mstr,';',i),':',1);
set bQty  := cast(SPLIT_STR(SPLIT_STR(mstr,';',i),':',2) as int);
set bRqty :=cast(SPLIT_STR(SPLIT_STR(mstr,';',i),':',3) as int);

if  bRqty>0 then 
if rCapacity>bRqty  then
  set rCapacity := rCapacity-bRqty; 
  set fAdjusted :=fAdjusted+bRqty;  
  set dAdjusted :=bRqty;  
  set bRqty :=0;
  
else if rCapacity<=bRqty  then 
  set bRqty := bRqty-rCapacity;
  set fAdjusted :=fAdjusted+rCapacity;
  set dAdjusted :=rCapacity;  
  set rCapacity :=0;
  
end if; 
end if; 
/* dAdjusted is then adjusted quantity for that delivery and dRemaining is remaining quantity for that delivery.*/

set dRemaining :=bRqty-dAdjusted;

if mstr not like concat('%',date_cur_str,'%') then
set fQty:=0;
else 
set fQty:=bQty;
end if;
/* calculate prev adjusted and feature adjusted */
if date_cur_str<bDate then
set vPostAdjusted :=dAdjusted;
set vPrevAdjusted:=0;
set fAdjusted :=0;
elseif  date_cur_str>bDate then
set vPrevAdjusted :=dAdjusted;
set vPostAdjusted:=0;
set fAdjusted :=0;
else
set fAdjusted :=dAdjusted;
set vPrevAdjusted :=0;
set vPostAdjusted:=0;
end if;

/* insert all entry for single delievery into temp_forecast_analysis */

insert into temp_forecast_analysis(parent_date,del_date,qty,del_count,remaining,adjusted,status,color,capacity,prev_adjusted,post_adjusted) values(date_cur_str,bDate,dAdjusted,fQty,bRqty,fAdjusted,'pending','orange',vCapacity,vPrevAdjusted,vPostAdjusted);
set mstr :=replace(mstr,SPLIT_STR(mstr,';',i),concat(date_format(bDate,'%Y-%m-%d'),':',bQty,':',bRqty));
end if;

set i:=i+1;
end while;
set i:=0;
if vHolidayFlag=1 then 
insert into temp_forecast_analysis(parent_date,qty,del_count,remaining,adjusted,status,color,capacity,prev_adjusted,post_adjusted,return_code) values(date_cur_str,0,0,0,0,'holiday','orange',0,0,0,'Holiday');
else
/*
calculate deliveries, trials,previous,current,post processed datewise and calculate color on following scenarios:
1) if total prcessed<capacity then green
2)If processed quantity=capacity and atlease one processed from feature or current date then orange
3)else red

*/
select sum(trial_no) into vTrials from `tabTrial Dates` td,tabTrials t where t.name=td.parent and t.item_code=pitem_code and td.work_status='Open' and ( td.production_status is null or td.production_status<>'Close') and date_format(td.trial_date,'%Y-%m-%d')=date_cur_str;
SELECT SUM(sii.tailoring_qty) into vDeliveries from `tabSales Invoice Items` sii where sii.tailoring_item_code=pitem_code and  sii.tailoring_delivery_date IS NOT NULL  and not exists(select true from `tabProduction Dashboard Details` pdd where sales_invoice_no=sii.parent and article_code=sii.tailoring_item_code and pdd.process_status='Completed' )  and date_format(sii.tailoring_delivery_date,'%Y-%m-%d')=date_cur_str;

set vTrials :=coalesce(vTrials,0);
set vDeliveries :=coalesce(vDeliveries,0);
update temp_forecast_analysis set trial_no=vTrials,deliveries=vDeliveries where parent_date=date_cur_str;

set return_string :=concat('{Date:',date_cur_str,'Deliverable:') ;
set fAdjusted:=0;

select sum(adjusted),sum(prev_adjusted),sum(post_adjusted),sum(remaining)  into  vAdjusted,vPrevCount,vPostCount,vRemCount from temp_forecast_analysis where parent_date=date_cur_str group by parent_date;
if (vPrevCount+vPostCount+vAdjusted)<vCapacity then
        set vColorDesc:='green';
elseif (vPrevCount+vPostCount+vAdjusted)=vCapacity and (vPostCount+vAdjusted)>0 then
         set vColorDesc:='orange';
else          
        set vColorDesc:='red';
end if;
/* update deliveries, trials,previous,current,post processed datewise date wise in return_code which will display in calender */
update temp_forecast_analysis t set color=vColorDesc,return_code=concat('Deliverable:',vDeliveries,' \n ','Trial Number:',vTrials,' \n ','Capacity:',vCapacity,' \n ','Current Processed:',vAdjusted,' \n','Previous adjustment:',vPrevCount,' \n','Next Adjustment:',vPostCount)  where  parent_date=date_cur_str;
set date_cur:=DATE_ADD(date_cur, INTERVAL 1 DAY);
end if;
end while;
/* insert for buffer entries */
 while v2Count<3 do             
       insert into temp_forecast_analysis(parent_date,status,color,qty,adjusted,prev_adjusted,post_adjusted,remaining,del_count,trial_no,deliveries,capacity,return_code) values(date_cur,'buffer','green',0,0,0,0,0,0,0,0,vCapacity,'Buffer Period');      
       set date_cur :=DATE_ADD(date_cur, INTERVAL 1 DAY); 
       set v2Count :=v2Count+1;       
 END WHILE;  

RETURN (pitem_code); 
End;
$$
