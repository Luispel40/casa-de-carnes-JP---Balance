const FooterPage = () => {
    return ( 
        <footer className="w-full p-6 text-center">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400 w-[300px] m-auto">© 2026 <a href="https://alphawebs.com.br/" target="_/blank" className="hover:underline">Alphawebs</a>. All Rights Reserved.
        </span>
        <ul className="flex gap-5 mt-4 text-sm text-gray-500 justify-evenly border-t-2 border-gray-500/50 p-6">
            <li>
                <a href="\sobre" className="hover:underline md:mr-6 ">About</a>
            </li>
            <li>
                <a href="\privacidade" className="hover:underline md:mr-6">Privacy Policy</a>
            </li>
            <li>
                <a href="\licenca" className="hover:underline md:mr-6 ">Licensing</a>
            </li>
            <li>
                <a href="\contato" className="hover:underline">Contact</a>
            </li>
        </ul>
    </footer>
     );
}
 
export default FooterPage;