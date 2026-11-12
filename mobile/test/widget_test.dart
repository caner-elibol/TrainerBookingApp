import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:pt_mobile/main.dart';

void main() {
  testWidgets('App starts and shows the auth loading state', (WidgetTester tester) async {
    await tester.pumpWidget(const PtMobileApp());
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
