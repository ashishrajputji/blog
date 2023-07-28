window.onload = ()=>{
   let el = document.getElementsByClassName('header__main__nav--icon')[0];
    el.addEventListener('click',displaySideNav);
    let abort = document.getElementsByClassName('side__nav__container__list-item-abort')[0];
    abort.addEventListener('click',hideSideNav);
    let outside = document.getElementsByClassName('side__nav')[0];
    outside.addEventListener('click',hideSideNav);
}

function hideSideNav(){
    let el = document.getElementsByClassName('side__nav')[0];
    el.style.display ="none";
    el.style.opacity = 0;
}

function displaySideNav(){
    console.log("Clicked");
    let el = document.getElementsByClassName('side__nav')[0];
    console.log(el);
    el.style.display ="block ";
    el.style.opacity = 1;
}