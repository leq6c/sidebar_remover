/* horizontal grid numbers */
let hor_num = 5;
/* vertical grid numbers */
let ver_num = 20;
/* sidebar max width factor of window width */
let max_width_factor = 0.3;
/* sidebar min height factor of window height */
let min_height_factor = 0.5;
/* main element start from */
let main_element_top_factor = 0.8;
/* main element min height */
let main_element_height_factor = 0.8;
/* main element max gap of bottom */
let main_element_bottom_diff = 100;
/* sidebar should be to the left of */
let sidebar_factor_left = 0.5;
/* sidebar should be to the right of */
let sidebar_factor_right = 0.5;
/* main element should be part of */
let outer_parent_counter = 10;
/* main element width smaller than parent */
let main_diff_min = -1;
/* dont delete elements that has following tags */
let ignore_tags = ["NOSCRIPT", "SCRIPT", "HEAD", "HTML"];
/* prefix of key */
let prefix = "simplify_";
/* enable this class when enabled */
let deleted_class = "simplify-deleted";

let width = window.innerWidth;
let height = window.innerHeight;
let min_height = height * min_height_factor;
let max_width = max_width_factor * width;

/* states */
let states = {
    deleted_elements: [],
    enabled: true,
    waiting_for_deletes: true
};

function get_key()
{
    return prefix + location.host;
}

function set_enabled_this_page(val)
{
    let dict = {};
    dict[get_key()] = val;
    chrome.storage.sync.set(dict, ()=>{});
}

function delete_element(elm)
{
    elm.classList.add(deleted_class);

    if(!states.deleted_elements.includes(elm))
    {
        states.deleted_elements.push(elm);
    }
}

function restore_element(elm)
{
    elm.classList.remove(deleted_class);
}

function find_main_element()
{
    let _elm = document.elementFromPoint(width / 2, height * main_element_top_factor);
    let elm = _elm;
    let bdx = elm.getBoundingClientRect();
    let lastBdx = bdx;
    let last_parent = elm;
    let contentHeight = document.body.clientHeight * main_element_height_factor;
    let last_diff_width = 0;

    while(elm != null)
    {
        last_parent = elm;
        elm = elm.parentElement;
        if(elm != null) {
            lastBdx = bdx;
            bdx = elm.getBoundingClientRect();
            last_diff_width = Math.abs(lastBdx.width - bdx.width);
        }

        if(bdx.height > contentHeight && last_diff_width > main_diff_min)
        {
            break;
        }
    }

    bdx = last_parent.getBoundingClientRect();

    let next_parent = last_parent.parentElement;

    if(next_parent != null)
    {
        let bottom_diff = Math.abs(next_parent.getBoundingClientRect().bottom - last_parent.getBoundingClientRect().bottom);
        if(bottom_diff < main_element_bottom_diff)
        {
            return next_parent;
        }
    }

    return last_parent;
}

function find_sidebar_element(_elm)
{
    if(_elm == null) {
        return null;
    }

    let elm = _elm;
    let bdx = elm.getBoundingClientRect();
    let last_parent = elm;

    while(elm != null && bdx.width <= max_width)
    {
        last_parent = elm;
        elm = elm.parentElement;
        if(elm != null) {
            bdx = elm.getBoundingClientRect();
        }
    }

    bdx = last_parent.getBoundingClientRect();

    if (bdx.width > max_width ||
        bdx.height < min_height || 
        (bdx.left <= width * 0.5 && (bdx.left > width * sidebar_factor_left || bdx.right > width * sidebar_factor_left)) || 
        (bdx.left > width * 0.5 && (bdx.left < width * sidebar_factor_right || bdx.right < width * sidebar_factor_right))
    )
    {
        return null;
    }

    return last_parent;
}

function lookup_side_children(start_x, start_y, width, height, elms)
{
    let e_width = width / hor_num;
    let e_height = height / ver_num;

    for(let x = 0; x < hor_num; x++)
    {
        for(let y = 0; y < ver_num; y++)
        {
            let elm = document.elementFromPoint(start_x + e_width * x, start_y + e_height * y);

            if(elm == null) {
                continue;
            }

            if(elms.includes(elm))
            {
                continue;
            }

            let bdx = elm.getBoundingClientRect();

            if (bdx.width > max_width ||
                (bdx.left <= width * 0.5 && (bdx.left > width * sidebar_factor_left || bdx.right > width * sidebar_factor_left)) || 
                (bdx.left > width * 0.5 && (bdx.left < width * sidebar_factor_right || bdx.right < width * sidebar_factor_right))
            )
            {
                continue;
            }

            elms.push(elm);
        }
    }

    return elms;
}

function remove_below_element(elm, target)
{
    let elm_bdx = elm.getBoundingClientRect();
    let removes = [];
    for(let i = 0; i < target.children.length; i++)
    {
        let tag = target.children[i].tagName.toLocaleUpperCase();
        if(ignore_tags.includes(tag))
        {
            continue;
        }
        let bdx = target.children[i].getBoundingClientRect();

        if(elm_bdx.bottom <= bdx.top)
        {
            removes.push(target.children[i]);
        }
    }

    removes.forEach((r) => {
        delete_element(r);
    });
}

function remove_above_element(elm, target)
{
    let elm_bdx = elm.getBoundingClientRect();
    let removes = [];
    for(let i = 0; i < target.children.length; i++)
    {
        let tag = target.children[i].tagName.toLocaleUpperCase();
        if(ignore_tags.includes(tag))
        {
            continue;
        }
        let bdx = target.children[i].getBoundingClientRect();

        if(elm_bdx.top >= bdx.bottom)
        {
            removes.push(target.children[i]);
        }
    }

    removes.forEach((r) => {
        delete_element(r);
    });
}

function get_sidebars()
{
    let elms = [];

    elms = lookup_side_children(0, 0, width * 0.5, height, elms);
    elms = lookup_side_children(width * 0.5, 0, width * 0.5, height, elms);

    let sidebars = [];

    for(let i = 0; i < elms.length; i++)
    {
        let sidebar = find_sidebar_element(elms[i]);
        if(sidebar != null && !sidebars.includes(sidebar))
        {
            sidebars.push(sidebar);
        }
    }

    return sidebars;
}

function remove_sidebars()
{
    let sidebars = get_sidebars();

    for(let i = 0; i < sidebars.length; i++)
    {
        delete_element(sidebars[i]);
    }
}

function remove_outer_elements()
{
    let main = find_main_element();

    let last_parent = main.parentElement;
    for(let i = 0; i < outer_parent_counter; i++)
    {
        if(last_parent == null)
        {
            break;
        }
        if(ignore_tags.includes(last_parent.tagName.toLocaleLowerCase()))
        {
            break;
        }

        remove_below_element(main, last_parent);
        remove_above_element(main, last_parent);

        last_parent = last_parent.parentElement;
    }
}

chrome.storage.sync.get(get_key(), (e) => {
    if(e[get_key()] == undefined || e[get_key()] == true)
    {
        remove_sidebars();
        //remove_outer_elements();

        //document.body.classList.add("simplified");

        states.enabled = true;
        states.waiting_for_deletes = false;

        chrome.runtime.sendMessage({"type": "updated", "enabled": true});
    }else{
        //disabled
        states.enabled = false;
        states.waiting_for_deletes = true;
        chrome.runtime.sendMessage({"type": "updated", "enabled": false});
    }

    chrome.runtime.onMessage.addListener((r, s, c) => {
        if(r["type"] != "click") {
            return;
        }
        if(states.waiting_for_deletes)
        {
            remove_sidebars();
            states.waiting_for_deletes = false;
        }else{
            if(states.enabled)
            {
                for(let i = 0; i < states.deleted_elements.length; i++)
                {
                    restore_element(states.deleted_elements[i]);
                }
            }else{
                for(let i = 0; i < states.deleted_elements.length; i++)
                {
                    delete_element(states.deleted_elements[i]);
                }
            }
        }
        states.enabled = !states.enabled;
        set_enabled_this_page(states.enabled);
        c({"enabled": states.enabled});
    });
});
