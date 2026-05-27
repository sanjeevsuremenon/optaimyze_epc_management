import React from "react";

function NavigationbetterComponent() {
  return (
    <div>
      <div className="w-full mx-auto bg-white px-0 sm:px-8 min-h-screen py-24 my-10">
        <div className="container mx-auto items-center">
          <ul
            id="tabs"
            className="inline-flex w-full space-x-2 sm:space-x-6 md:space-x-12 items-center border-b overflow-hidden border-gray-300"
          >
            <li className="px-4 py-2 -mb-px font-semibold text-gray-800 dark:text-white hover:text-green-400 dark:hover:text-gray-300 border-b-2 border-green-400 dark:border-gray-50 hover:border-green-300 dark:hover:border-gray-200 rounded-t opacity-50">
              <a id="default-tab" href="#first">
                Home
              </a>
            </li>
            <li className="px-4 py-2 font-semibold text-gray-800 dark:text-white hover:text-green-400 dark:hover:text-gray-300 rounded-t opacity-50 hover:border-green-300 dark:hover:border-gray-200">
              <a href="#second">About</a>
            </li>
            <li className="px-4 py-2 font-semibold text-gray-800 dark:text-white hover:text-green-400 dark:hover:text-gray-300 rounded-t opacity-50 hover:border-green-300 dark:hover:border-gray-200">
              <a href="#third">Features</a>
            </li>
            <li className="px-4 py-2 font-semibold text-gray-800 dark:text-white hover:text-green-400 dark:hover:text-gray-300 rounded-t opacity-50 hover:border-green-300 dark:hover:border-gray-200">
              <a href="#fourth">Contact</a>
            </li>
          </ul>
          <div id="tab-contents">
            <div id="first" className="p-2 sm:p-4">
              <div className="px-4 py-8 w-full bg-gray-200 rounded-lg">
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Ullam, expedita magni omnis dolorem doloribus totam
                  laudantium, delectus accusantium quisquam ad fuga maiores
                  dolor similique hic. Ipsum hic ratione culpa!
                </p>
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Ullam, expedita magni omnis dolorem doloribus totam
                  laudantium, delectus accusantium quisquam ad fuga maiores
                  dolor similique hic. Ipsum hic ratione culpa!
                </p>
              </div>
            </div>
            <div id="second" className="hidden p-2 sm:p-4">
              <div className="px-4 py-8 w-full bg-gray-200 rounded-lg">
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Placeat, libero. Laboriosam magnam doloribus fugit minus
                  minima suscipit fugiat. Error commodi fugit quos non explicabo
                  a repudiandae magni labore modi, dignissimos vero voluptas,
                  quis eius provident.
                </p>
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                  Placeat, libero. Laboriosam magnam doloribus fugit minus
                  minima suscipit fugiat. Error commodi fugit quos non explicabo
                  a repudiandae magni labore modi, dignissimos vero voluptas,
                  quis eius provident.
                </p>
              </div>
            </div>
            <div id="third" className="hidden p-2 sm:p-4">
              <div className="px-4 py-8 w-full bg-gray-200 rounded-lg">
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ea
                  beatae, fuga itaque vitae ad, corrupti voluptatibus cupiditate
                  sapiente enim error molestiae excepturi atque voluptatum
                  inventore tempora blanditiis facere praesentium ratione.
                </p>
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ea
                  beatae, fuga itaque vitae ad, corrupti voluptatibus cupiditate
                  sapiente enim error molestiae excepturi atque voluptatum
                  inventore tempora blanditiis facere praesentium ratione.
                </p>
              </div>
            </div>
            <div id="fourth" className="hidden p-2 sm:p-4">
              <div className="px-4 py-8 w-full bg-gray-200 rounded-lg">
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe
                  vel cum reiciendis distinctio minus, esse dolorem corporis in
                  omnis, quidem ut! Culpa, sunt velit? Optio velit eveniet omnis
                  assumenda et culpa voluptatibus? Veniam sed illum ut
                  blanditiis, aliquid reprehenderit, atque deleniti dolorem
                  impedit perspiciatis facilis, ipsum cupiditate eveniet
                  sapiente suscipit!
                </p>
                <p className="text-sm sm:text-base text-justify sm:px-2 px-4 py-1 sm:py-2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe
                  vel cum reiciendis distinctio minus, esse dolorem corporis in
                  omnis, quidem ut! Culpa, sunt velit? Optio velit eveniet omnis
                  assumenda et culpa voluptatibus? Veniam sed illum ut
                  blanditiis, aliquid reprehenderit, atque deleniti dolorem
                  impedit perspiciatis facilis, ipsum cupiditate eveniet
                  sapiente suscipit!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavigationbetterComponent;
