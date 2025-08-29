/*
 * Copyright 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *	  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.restservice;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

public class GreetingControllerTests {

	private final GreetingController controller = new GreetingController();

	@Test
	public void noParamGreetingShouldReturnDefaultMessage() throws Exception {
		Greeting greeting = controller.greeting("World");
		assertEquals("Hello, World!", greeting.content());
	}

	@Test
	public void paramGreetingShouldReturnTailoredMessage() throws Exception {
		Greeting greeting = controller.greeting("Spring Community");
		assertEquals("Hello, Spring Community!", greeting.content());
	}

}
